import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, RequestMeta } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './roles.guard';
import {
  EmailSignupDto,
  EmailLoginDto,
  SendVerificationEmailDto,
  VerifyEmailDto,
  ResendVerificationEmailDto,
  ForgotPasswordDto,
  ValidateResetTokenDto,
  ResetPasswordDto,
} from './dto';
import { IsString, IsNotEmpty } from 'class-validator';

class GoogleCallbackDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

function requestMeta(req: Request): RequestMeta {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  // Email-based authentication
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('signup/email')
  async signupWithEmail(@Body() dto: EmailSignupDto) {
    return this.authService.signupWithEmail(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login/email')
  async loginWithEmail(@Body() dto: EmailLoginDto, @Req() req: Request) {
    return this.authService.loginWithEmail(dto, requestMeta(req));
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto.refreshToken, requestMeta(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: RequestUser) {
    await this.authService.logoutAll(user.userId);
    return { success: true };
  }

  // Email verification flow
  @Throttle({ default: { limit: 2, ttl: 300000 } })
  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: SendVerificationEmailDto) {
    return this.emailVerificationService.sendVerificationEmail(body.email);
  }

  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmailToken(
      body.email,
      body.code,
      requestMeta(req),
    );
  }

  @Throttle({ default: { limit: 2, ttl: 300000 } })
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(body.email);
  }

  // Password reset flow
  @Throttle({ default: { limit: 2, ttl: 600000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    // Always return the same success response to prevent email enumeration
    try {
      await this.passwordResetService.sendPasswordResetEmail(body.email);
    } catch {
      // Swallow — caller sees same message whether email exists or not
    }
    return {
      success: true,
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('validate-reset-token')
  async validateResetToken(@Body() body: ValidateResetTokenDto) {
    return this.passwordResetService.validateResetToken(body.token, body.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }

  // Google Identity Services (One-Tap) — receives an ID token from the frontend.
  // (The redirect-flow GET /auth/google + GET /auth/google/callback endpoints
  // were removed as dead code — apps/web only ever calls this One-Tap flow.)
  @Post('google/callback')
  async googleTokenCallback(
    @Body() dto: GoogleCallbackDto,
    @Req() req: Request,
  ) {
    return this.authService.verifyGoogleToken(dto.token, requestMeta(req));
  }
}
