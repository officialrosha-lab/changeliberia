import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto, EmailSignupDto, EmailLoginDto, GoogleAuthCallbackDto } from './dto';
import { OtpProvider } from './otp.provider';
import { PasswordProvider } from './password.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otpProvider: OtpProvider,
    private readonly passwordProvider: PasswordProvider,
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
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.issueToken(user.id, user.phone);
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

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        authProvider: 'EMAIL',
      },
    });

    return this.issueToken(user.id, user.phone);
  }

  /**
   * Log in with email and password
   */
  async loginWithEmail(dto: EmailLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await this.passwordProvider.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user.id, user.phone);
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
}

