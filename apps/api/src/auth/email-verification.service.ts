import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate a verification token and send email to user
   */
  async sendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    // Check if email is already verified (has active user account)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // Generate a random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    await this.emailService.sendEmail({
      recipientEmail: email,
      subject: 'Verify your Change Liberia email address',
      templateType: 'email_verification',
      htmlContent: `Click to verify: ${verificationUrl}`,
      textContent: `Click to verify: ${verificationUrl}`,
    });

    return {
      success: true,
      message: 'Verification email sent. Check your inbox.',
    };
  }

  /**
   * Verify the email token
   */
  async verifyEmail(email: string, token: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(token);

    // Find the verification token
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid verification token');
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new UnauthorizedException('Verification link has expired');
    }

    // Check if email matches
    if (verificationToken.email !== email) {
      throw new UnauthorizedException('Email does not match token');
    }

    // Check if already verified
    if (verificationToken.verified) {
      throw new BadRequestException('Email has already been verified');
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
    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: { email, verified: true },
    });

    return !!verificationToken;
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
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
