import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateGovernmentContactDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  priority!: number;
}
