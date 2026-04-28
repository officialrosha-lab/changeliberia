import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto, OtpRequestDto, OtpVerifyDto, SignupDto, EmailSignupDto, EmailLoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  // Phone-based authentication (existing)
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('otp/request')
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  // Email-based authentication (new)
  @Post('signup/email')
  async signupWithEmail(@Body() dto: EmailSignupDto) {
    return this.authService.signupWithEmail(dto);
  }

  @Post('login/email')
  async loginWithEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  // Email verification flow
  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: { email: string }) {
    return this.emailVerificationService.sendVerificationEmail(body.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    return this.emailVerificationService.verifyEmail(body.email, body.token);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: { email: string }) {
    return this.emailVerificationService.resendVerificationEmail(body.email);
  }

  // Password reset flow
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.passwordResetService.sendPasswordResetEmail(body.email);
  }

  @Post('validate-reset-token')
  async validateResetToken(@Body() body: { email: string; token: string }) {
    return this.passwordResetService.validateResetToken(body.token, body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; token: string; newPassword: string },
  ) {
    return this.passwordResetService.resetPassword(body.email, body.token, body.newPassword);
  }

  // Google OAuth (new)
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Google OAuth redirect - handled by passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: any) {
    return req.user;
  }

  // Google Identity Services (One-Tap) — receives an ID token from the frontend
  @Post('google/callback')
  async googleTokenCallback(@Body() body: { token: string }) {
    return this.authService.verifyGoogleToken(body.token);
  }
}

