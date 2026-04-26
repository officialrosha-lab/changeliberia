import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString() fullName!: string;
  @IsString() phone!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @MinLength(6) password?: string;
}

export class EmailSignupDto {
  @IsString() fullName!: string;
  @IsString() phone!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

export class EmailLoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class LoginDto {
  @IsString() phone!: string;
  @IsOptional() @IsString() password?: string;
}

export class OtpRequestDto {
  @IsString() phone!: string;
}

export class OtpVerifyDto {
  @IsString() phone!: string;
  @IsString() code!: string;
}

export class GoogleAuthCallbackDto {
  @IsString() googleId!: string;
  @IsEmail() googleEmail!: string;
  @IsString() fullName!: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

export class SendVerificationEmailDto {
  @IsEmail() email!: string;
}

export class VerifyEmailDto {
  @IsEmail() email!: string;
  @IsString() token!: string;
}

export class ResendVerificationEmailDto {
  @IsEmail() email!: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}

export class ValidateResetTokenDto {
  @IsEmail() email!: string;
  @IsString() token!: string;
}

export class ResetPasswordDto {
  @IsEmail() email!: string;
  @IsString() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

