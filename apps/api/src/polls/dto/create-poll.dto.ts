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
import * as net from 'net';

function isPrivateHost(hostname: string): boolean {
  // Reject localhost names
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true;
  // Only apply numeric range checks to IPv4 addresses
  if (net.isIPv4(hostname)) {
    const parts = hostname.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;                           // 10.0.0.0/8
    if (a === 127) return true;                          // 127.0.0.0/8
    if (a === 169 && b === 254) return true;             // 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;             // 192.168.0.0/16
  }
  // Reject IPv6 loopback / link-local
  if (net.isIPv6(hostname)) return true;
  return false;
}

function isImageUrlOrBase64(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const base64ImagePattern = /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/;
  if (base64ImagePattern.test(value)) return true;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (isPrivateHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
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
