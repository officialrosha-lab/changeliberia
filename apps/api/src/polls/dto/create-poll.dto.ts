import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  ValidateNested,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

function isImageUrlOrBase64(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const urlPattern = /^(https?:\/\/[^\s]+)$/i;
  const base64ImagePattern = /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/;
  return urlPattern.test(value) || base64ImagePattern.test(value);
}

function IsImageUrlOrBase64(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrlOrBase64',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isImageUrlOrBase64(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid image URL or base64-encoded image string`;
        },
      },
    });
  };
}

export class PollOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsImageUrlOrBase64({ message: 'imageUrl must be a valid URL or base64 image string' })
  imageUrl?: string; // Base64 or URL
}

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
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options!: PollOptionDto[]; // Supports text and optional imageUrl for each option

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedPetitionIds?: string[]; // IDs of related petitions
}
