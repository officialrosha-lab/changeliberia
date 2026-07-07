import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EndorserType } from '@prisma/client';

export class CreateEndorsementDto {
  @IsString() @MaxLength(200) endorserName!: string;
  @IsEnum(EndorserType) endorserType!: EndorserType;
  @IsOptional() @IsString() @MaxLength(200) endorserTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) organization?: string;
  @IsOptional() @IsString() @MaxLength(2000) statement?: string;
}

export class RejectEndorsementDto {
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
