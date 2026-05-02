import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class CreateAmbassadorApplicationDto {
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone!: string;

  @IsString()
  @MinLength(2, { message: 'Location is required' })
  location!: string; // Liberian county

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Occupation cannot exceed 100 characters' })
  occupation?: string;

  @IsString()
  @MinLength(20, { message: 'Motivation must be at least 20 characters' })
  @MaxLength(1000, { message: 'Motivation cannot exceed 1000 characters' })
  motivation!: string;

  @IsString()
  @MinLength(20, { message: 'Growth plan must be at least 20 characters' })
  @MaxLength(1000, { message: 'Growth plan cannot exceed 1000 characters' })
  growthPlan!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Social links cannot exceed 500 characters' })
  socialLinks?: string;
}

export class UpdateAmbassadorApplicationDto {
  @IsOptional()
  @IsString()
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}

export class AmbassadorApplicationResponseDto {
  id!: string;
  fullName!: string;
  email!: string;
  phone!: string;
  location!: string;
  occupation?: string;
  motivation!: string;
  growthPlan!: string;
  socialLinks?: string;
  status!: ApplicationStatus;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
