import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, RequestMeta } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './roles.guard';
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from './cookie.util';
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

function requestMeta(req: Request): RequestMeta {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
}

function readRefreshCookie(req: Request): string {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (!token) throw new UnauthorizedException('No refresh token present');
  return token;
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
  async loginWithEmail(
    @Body() dto: EmailLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.loginWithEmail(dto, requestMeta(req));
    setAuthCookies(res, { accessToken, refreshToken });
    return { success: true, user };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshToken(
      readRefreshCookie(req),
      requestMeta(req),
    );
    setAuthCookies(res, { accessToken, refreshToken });
    return { success: true };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (token) await this.authService.logout(token);
    clearAuthCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.userId);
    clearAuthCookies(res);
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
  async verifyEmail(
    @Body() body: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.verifyEmailToken(
        body.email,
        body.code,
        requestMeta(req),
      );
    setAuthCookies(res, { accessToken, refreshToken });
    return { success: true, user };
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
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.verifyGoogleToken(dto.token, requestMeta(req));
    setAuthCookies(res, { accessToken, refreshToken });
    return { success: true, user };
  }
}
