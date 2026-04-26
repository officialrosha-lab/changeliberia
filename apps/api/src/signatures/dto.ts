import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSignatureDto {
  @IsString() petitionId!: string;
  @IsString() name!: string;
  @IsOptional() @IsBoolean() anonymous?: boolean;
  @IsOptional() @IsString() deviceFingerprint?: string;
  @IsOptional() @IsString() captchaToken?: string;
}
