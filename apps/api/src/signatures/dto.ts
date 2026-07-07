import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { RelationshipType } from '@prisma/client';

export class CreateSignatureDto {
  @IsString() petitionId!: string;
  @IsString() name!: string;
  @IsOptional() @IsBoolean() anonymous?: boolean;
  @IsOptional() @IsString() deviceFingerprint?: string;
  @IsOptional() @IsString() captchaToken?: string;

  // Petition Location Verification & Impact Area System (Phase 1) —
  // all optional; a client that sends none of these still signs
  // successfully and simply falls back to an UNKNOWN classification.
  @IsOptional() @IsBoolean() personallyAffected?: boolean; // Step 1
  @IsOptional() @IsEnum(RelationshipType) relationshipType?: RelationshipType; // Step 2
  @IsOptional() @IsString() confirmedCounty?: string; // Step 3
  @IsOptional() @IsString() confirmedDistrict?: string;
  @IsOptional() @IsString() confirmedCommunity?: string;
  @IsOptional() @IsIn(['profile_match', 'user_confirmed', 'unconfirmed']) locationSource?: string;
}
