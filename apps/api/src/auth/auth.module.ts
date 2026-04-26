import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { OtpProvider } from './otp.provider';
import { PasswordProvider } from './password.provider';
import { RolesGuard } from './roles.guard';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'super-secret' }),
    EmailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    OtpProvider,
    PasswordProvider,
    RolesGuard,
    EmailVerificationService,
    PasswordResetService,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
