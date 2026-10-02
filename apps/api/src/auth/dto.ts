import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class EmailSignupDto {
  @IsString() fullName!: string;
  @IsOptional() @IsString() phone?: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

export class EmailLoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
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
  @IsString() code!: string;
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
