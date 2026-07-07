import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ImpactScope } from '@prisma/client';

export class UpdatePetitionDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() @Min(100) goal?: number;
  @IsOptional() @IsString() petitionType?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categories?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(4000) priorActions?: string;
  @IsOptional() @IsBoolean() isAnonymous?: boolean;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional() @IsString() county?: string;
  // Petition Location Verification & Impact Area System (Phase 1)
  @IsOptional() @IsEnum(ImpactScope) impactScope?: ImpactScope;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() community?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) counties?: string[];
}

export class CreatePetitionDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsString() @MaxLength(500) summary!: string;
  @IsString() @MaxLength(20000) description!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categories?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() petitionType?: string;
  @IsOptional() @IsString() @MaxLength(4000) priorActions?: string;
  @IsOptional() @IsBoolean() isAnonymous?: boolean;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsInt() @Min(100) goal?: number;
  // Petition Location Verification & Impact Area System (Phase 1)
  @IsOptional() @IsEnum(ImpactScope) impactScope?: ImpactScope;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() community?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) counties?: string[];
}

export class CreatePetitionUpdateDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(8000)
  body!: string;
}

export class CreatePetitionCommentDto {
  @IsString()
  @MaxLength(120)
  authorName!: string;

  @IsString()
  @MaxLength(4000)
  body!: string;
}
