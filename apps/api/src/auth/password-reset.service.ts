import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, Optional, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PasswordProvider } from './password.provider';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly emailService: EmailService | null,
    private readonly passwordProvider: PasswordProvider,
  ) {}

  /**
   * Generate a password reset token and send email to user
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link will be sent.',
      };
    }

    // Generate a random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing unused reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new password reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    if (this.emailService) {
      await this.emailService.sendEmail({
        recipientEmail: email,
        subject: 'Reset your Change Liberia password',
        templateType: 'password_reset',
        htmlContent: `Click to reset: ${resetUrl}`,
        textContent: `Click to reset: ${resetUrl}`,
      });
    } else {
      this.logger.warn('EmailService not available - cannot send password reset email');
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent.',
    };
  }

  /**
   * Validate and process password reset
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate password strength
    const passwordValidation = this.passwordProvider.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    const tokenHash = this.hashToken(token);

    // Find the password reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid password reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Password reset link has expired');
    }

    // Check if token was already used
    if (resetToken.used) {
      throw new UnauthorizedException('Password reset link has already been used');
    }

    // Check if email matches
    if (resetToken.user.email !== email) {
      throw new UnauthorizedException('Email does not match token');
    }

    // Hash new password
    const passwordHash = await this.passwordProvider.hashPassword(newPassword);

    // Update user password and mark token as used
    await Promise.all([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Send confirmation email
    if (this.emailService) {
      await this.emailService.sendEmail({
        recipientEmail: email,
        subject: 'Your Change Liberia password has been reset',
        templateType: 'password_reset_confirmation',
        htmlContent: `Your password has been successfully reset.`,
        textContent: `Your password has been successfully reset.`,
      });
    } else {
      this.logger.warn('EmailService not available - cannot send password reset confirmation email');
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  /**
   * Verify that a password reset token is valid
   */
  async validateResetToken(token: string, email: string): Promise<{ valid: boolean }> {
    const tokenHash = this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      return { valid: false };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    if (resetToken.used) {
      return { valid: false };
    }

    if (resetToken.user.email !== email) {
      return { valid: false };
    }

    return { valid: true };
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
