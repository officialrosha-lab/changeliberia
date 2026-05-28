import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto, EmailSignupDto, EmailLoginDto, GoogleAuthCallbackDto } from './dto';
import { OtpProvider } from './otp.provider';
import { PasswordProvider } from './password.provider';
import { EmailVerificationService } from './email-verification.service';
import { EmailService } from '../email/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otpProvider: OtpProvider,
    private readonly passwordProvider: PasswordProvider,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly emailService: EmailService,
  ) {}

  async signup(dto: SignupDto) {
    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: { fullName: dto.fullName, email: dto.email },
      create: { fullName: dto.fullName, phone: dto.phone, email: dto.email },
    });
    return this.issueToken(user.id, user.phone);
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (!user) throw new UnauthorizedException('Invalid credentials');
      
      return this.issueToken(user.id, user.phone);
    } catch (error) {
      throw error;
    }
  }

  requestOtp(phone: string) {
    this.otpProvider.sendOtp(phone);
    return { success: true };
  }

  async verifyOtp(phone: string, code: string) {
    const ok = this.otpProvider.verifyOtp(phone, code);
    if (!ok) throw new UnauthorizedException('Invalid OTP code');
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, fullName: 'New User' },
    });
    return this.issueToken(user.id, user.phone);
  }

  private issueToken(sub: string, phone: string) {
    return {
      accessToken: this.jwt.sign({ sub, phone }),
    };
  }

  /**
   * Sign up with email and password
   * Requires fullName, phone, email, and password
   * User must verify email before being able to login
   */
  async signupWithEmail(dto: EmailSignupDto) {
    // Validate password strength
    const passwordValidation = this.passwordProvider.validatePasswordStrength(dto.password);
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

    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new BadRequestException('Phone number already registered');
    }

    // Hash password
    const passwordHash = await this.passwordProvider.hashPassword(dto.password);

    // Create user with isEmailConfirmed = false
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        authProvider: 'EMAIL',
        isEmailConfirmed: false,
      },
    });

    // Generate and send verification email
    await this.emailVerificationService.sendVerificationEmail(dto.email);

    return {
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      email: dto.email,
    };
  }

  /**
   * Log in with email and password
   * Email must be verified before login is allowed
   */
  async loginWithEmail(dto: EmailLoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if email is confirmed
      if (!user.isEmailConfirmed) {
        throw new UnauthorizedException('Please verify your email before logging in');
      }

      const passwordValid = await this.passwordProvider.verifyPassword(
        dto.password,
        user.passwordHash,
      );

      if (!passwordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return this.issueToken(user.id, user.phone);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle Google OAuth callback
   * Creates user if doesn't exist, or links Google account to existing user
   */
  async loginWithGoogle(dto: GoogleAuthCallbackDto) {
    // Try to find user by Google ID first
    let user = await this.prisma.user.findUnique({
      where: { googleId: dto.googleId },
    });

    if (user) {
      // User already has Google linked
      return this.issueToken(user.id, user.phone);
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
      return this.issueToken(user.id, user.phone);
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

    return this.issueToken(newUser.id, newUser.phone);
  }

  /**
   * Verify a Google ID token (from @react-oauth/google One-Tap) and log the user in.
   * Called by POST /auth/google/callback with { token: <id_token> }.
   */
  async verifyGoogleToken(idToken: string) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google OAuth is not configured on this server');
    }
    const client = new OAuth2Client(clientId);
    let payload: { sub: string; email?: string; name?: string; picture?: string } | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const p = ticket.getPayload();
      if (p) payload = { sub: p.sub, email: p.email, name: p.name, picture: p.picture };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    return this.loginWithGoogle({
      googleId: payload.sub,
      googleEmail: payload.email ?? '',
      fullName: payload.name ?? payload.email ?? 'Google User',
      avatarUrl: payload.picture,
    });
  }

  /**
   * Verify email token and mark email as confirmed
   * Returns JWT token if successful
   */
  async verifyEmailToken(email: string, token: string) {
    // Verify the token with email verification service
    await this.emailVerificationService.verifyEmail(email, token);

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
    return this.issueToken(user.id, user.phone);
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

