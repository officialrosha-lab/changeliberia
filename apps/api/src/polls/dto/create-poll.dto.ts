import { IsString, IsOptional, IsArray, IsDateString, MinLength } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string; // e.g., "Infrastructure", "Health", "Education"

  @IsOptional()
  @IsString()
  county?: string; // null = national, otherwise county-specific

  @IsDateString()
  expiresAt!: string; // ISO 8601 format

  @IsArray()
  options!: string[]; // Array of poll option texts (minimum 2)

  @IsOptional()
  @IsArray()
  relatedPetitionIds?: string[]; // IDs of related petitions
}
