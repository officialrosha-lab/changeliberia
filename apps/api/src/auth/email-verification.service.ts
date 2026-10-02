import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt, createHash } from 'crypto';

const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a verification token and send email to user
   */
  async sendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if email is already verified (has active user account). A user
    // row existing but not yet confirmed is the normal post-signup state —
    // signupWithEmail creates the row and immediately calls this method to
    // send the first verification email, so blocking on mere existence
    // would reject every real signup.
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.isEmailConfirmed) {
      throw new BadRequestException('Email is already registered');
    }

    // Generate a 6-digit numeric code
    const code = String(randomInt(100000, 1000000));
    const tokenHash = this.hashCode(code, email);

    // Codes are short and user-entered, so they expire much sooner than the
    // old 24h link did.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing tokens for this email
    await this.prisma.emailVerificationToken.deleteMany({
      where: { email },
    });

    // Create new verification token
    await this.prisma.emailVerificationToken.create({
      data: {
        email,
        token: tokenHash,
        expiresAt,
      },
    });

    // Send verification email via the Maileroo-backed EmailService (EmailEventService listens for this)
    this.eventEmitter.emit('user.email.verification-requested', {
      userId: existingUser?.id,
      email,
      verificationCode: code,
      fullName: existingUser?.fullName,
    });

    return {
      success: true,
      message: 'Verification email sent. Check your inbox.',
    };
  }

  /**
   * Verify the email against a submitted 6-digit code
   */
  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    // Codes are short and guessable, so (unlike the old opaque-token lookup)
    // we find the active attempt by email first and compare hashes, which
    // lets us count and cap wrong guesses per code.
    const verificationToken =
      await this.prisma.emailVerificationToken.findFirst({
        where: { email, verified: false },
      });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new UnauthorizedException('Verification code has expired');
    }

    // Atomically claim one attempt slot: the `attempts < MAX` condition and
    // the increment happen as a single DB operation, so concurrent requests
    // can't all read the same stale `attempts` value, each conclude they're
    // still under the cap, and all get to test a guess before any of their
    // increments land — closing a brute-force path the previous
    // read-then-write check left open.
    const { count } = await this.prisma.emailVerificationToken.updateMany({
      where: {
        id: verificationToken.id,
        attempts: { lt: MAX_VERIFY_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    });

    if (count === 0) {
      await this.prisma.emailVerificationToken.deleteMany({
        where: { id: verificationToken.id },
      });
      throw new UnauthorizedException(
        'Too many incorrect attempts. Request a new code.',
      );
    }

    if (this.hashCode(code, email) !== verificationToken.token) {
      throw new UnauthorizedException('Incorrect verification code');
    }

    // Mark as verified
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { verified: true },
    });

    // Delete all other tokens for this email
    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        email,
        id: { not: verificationToken.id },
      },
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Check if an email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const verificationToken =
      await this.prisma.emailVerificationToken.findFirst({
        where: { email, verified: true },
      });

    return !!verificationToken;
  }

  /**
   * Hash a code, salted per-email, using SHA-256
   */
  private hashCode(code: string, email: string): string {
    return createHash('sha256').update(`${code}:${email}`).digest('hex');
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if there's an existing unverified token for this email
    const existingToken = await this.prisma.emailVerificationToken.findFirst({
      where: { email, verified: false },
    });

    if (!existingToken) {
      // If no unverified token, treat as new verification request
      return this.sendVerificationEmail(email);
    }

    // If existing token is not expired, allow resend but delete old one
    await this.prisma.emailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    // Send new verification email
    return this.sendVerificationEmail(email);
  }
}
