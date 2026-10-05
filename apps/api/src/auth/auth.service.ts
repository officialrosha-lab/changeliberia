import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailSignupDto, EmailLoginDto, GoogleAuthCallbackDto } from './dto';
import { PasswordProvider } from './password.provider';
import { EmailVerificationService } from './email-verification.service';

const ACCESS_TOKEN_TTL = '20m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwordProvider: PasswordProvider,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Non-sensitive user fields safe to return in a login/signup response body. */
  private publicUser(user: {
    id: string;
    email: string | null;
    fullName: string;
    role: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  private async withUser<
    T extends { accessToken: string; refreshToken: string },
  >(
    pairPromise: Promise<T>,
    user: { id: string; email: string | null; fullName: string; role: string },
  ) {
    const pair = await pairPromise;
    return { ...pair, user: this.publicUser(user) };
  }

  /**
   * Issue a fresh access/refresh pair for a user, starting a new rotation
   * family. Persists a RefreshToken row holding only the token's hash.
   */
  private async issueTokenPair(
    sub: string,
    phone: string,
    meta: RequestMeta = {},
    familyId: string = randomBytes(16).toString('hex'),
  ) {
    const accessToken = this.jwt.sign(
      { sub, phone },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    const refreshToken = randomBytes(32).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: sub,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });
    return { accessToken, refreshToken };
  }

  /**
   * Exchange a refresh token for a new access/refresh pair, rotating the
   * refresh token on every use. If the presented token has already been
   * rotated away (i.e. someone replayed an old token — theft/reuse), the
   * entire rotation family is revoked as a theft-detection response.
   */
  async refreshToken(presentedToken: string, meta: RequestMeta = {}) {
    const tokenHash = this.hashToken(presentedToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!row) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (row.revokedAt) {
      // Reuse of an already-rotated (or already-logged-out) token — revoke
      // the whole family in case this is a stolen token being replayed.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: row.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected — session revoked',
      );
    }

    if (row.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const pair = await this.issueTokenPair(
      user.id,
      user.phone,
      meta,
      row.familyId,
    );

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: this.hashToken(pair.refreshToken),
      },
    });

    return pair;
  }

  /** Revoke the rotation family the presented refresh token belongs to. */
  async logout(presentedToken: string): Promise<void> {
    const tokenHash = this.hashToken(presentedToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: row.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke every active refresh token family for a user — all devices. */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Sign up with email and password
   * Requires fullName, phone, email, and password
   * User must verify email before being able to login
   */
  async signupWithEmail(dto: EmailSignupDto) {
    // Validate password strength
    const passwordValidation = this.passwordProvider.validatePasswordStrength(
      dto.password,
    );
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already registered');
    }

    // Check if phone already exists (email signup doesn't collect one, but
    // still honor it if a caller passes one explicitly)
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await this.passwordProvider.hashPassword(dto.password);

    // Email signups don't collect a phone number, so — same as the Google
    // signup path — fall back to a unique placeholder for the required,
    // unique `phone` column.
    const phone = dto.phone || `email_${randomBytes(8).toString('hex')}`;

    // Create user with isEmailConfirmed = false
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone,
        email: dto.email,
        passwordHash,
        authProvider: 'EMAIL',
        isEmailConfirmed: false,
      },
    });

    // Welcome email + generate and send verification email
    this.eventEmitter.emit('user.created', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      requiresEmailVerification: true,
    });
    await this.emailVerificationService.sendVerificationEmail(dto.email);

    return {
      success: true,
      message:
        'Account created successfully. Please check your email to verify your account.',
      email: dto.email,
    };
  }

  /**
   * Log in with email and password
   */
  async loginWithEmail(dto: EmailLoginDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException(
        "email_not_verified|Your email address needs to be verified. Please check your inbox for a verification code from Change Liberia. If you don't see it, you can request a new one below.",
      );
    }

    const passwordValid = await this.passwordProvider.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.withUser(this.issueTokenPair(user.id, user.phone, meta), user);
  }

  /**
   * Handle Google OAuth callback
   * Creates user if doesn't exist, or links Google account to existing user
   */
  async loginWithGoogle(dto: GoogleAuthCallbackDto, meta: RequestMeta = {}) {
    // Try to find user by Google ID first
    let user = await this.prisma.user.findUnique({
      where: { googleId: dto.googleId },
    });

    if (user) {
      // User already has Google linked
      return this.withUser(
        this.issueTokenPair(user.id, user.phone, meta),
        user,
      );
    }

    // Try to find user by Google email
    user = await this.prisma.user.findUnique({
      where: { email: dto.googleEmail },
    });

    if (user) {
      // User exists but hasn't linked Google yet - update with Google ID
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: dto.googleId,
          googleEmail: dto.googleEmail,
          avatarUrl: dto.avatarUrl || user.avatarUrl,
        },
      });
      return this.withUser(
        this.issueTokenPair(user.id, user.phone, meta),
        user,
      );
    }

    // Create new user from Google profile
    // For new Google signups without phone, we'll need to collect it later
    // For now, we'll use Google ID as a temporary phone-like identifier
    const tempPhone = `google_${dto.googleId}`;

    const newUser = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.googleEmail,
        phone: tempPhone,
        googleId: dto.googleId,
        googleEmail: dto.googleEmail,
        avatarUrl: dto.avatarUrl,
        authProvider: 'GOOGLE',
      },
    });

    if (newUser.email) {
      this.eventEmitter.emit('user.created', {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        requiresEmailVerification: false,
      });
    }

    return this.withUser(
      this.issueTokenPair(newUser.id, newUser.phone, meta),
      newUser,
    );
  }

  /**
   * Verify a Google ID token (from @react-oauth/google One-Tap) and log the user in.
   * Called by POST /auth/google/callback with { token: <id_token> }.
   */
  async verifyGoogleToken(idToken: string, meta: RequestMeta = {}) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException(
        'Google OAuth is not configured on this server',
      );
    }
    const client = new OAuth2Client(clientId);
    let payload:
      | { sub: string; email?: string; name?: string; picture?: string }
      | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const p = ticket.getPayload();
      if (p)
        payload = {
          sub: p.sub,
          email: p.email,
          name: p.name,
          picture: p.picture,
        };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    return this.loginWithGoogle(
      {
        googleId: payload.sub,
        googleEmail: payload.email ?? '',
        fullName: payload.name ?? payload.email ?? 'Google User',
        avatarUrl: payload.picture,
      },
      meta,
    );
  }

  /**
   * Verify email token and mark email as confirmed
   * Returns JWT token if successful
   */
  async verifyEmailToken(email: string, code: string, meta: RequestMeta = {}) {
    // Verify the code with email verification service
    await this.emailVerificationService.verifyEmail(email, code);

    // Find user and mark email as confirmed
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user to mark email as confirmed
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailConfirmed: true },
    });

    // Return JWT token for immediate login
    return this.withUser(this.issueTokenPair(user.id, user.phone, meta), user);
  }

  /**
   * Resend verification email to user
   */
  async resendVerificationEmail(email: string) {
    // Check if user exists with this email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If email already confirmed, no need to resend
    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email is already verified');
    }

    // Resend verification email
    return await this.emailVerificationService.resendVerificationEmail(email);
  }
}
