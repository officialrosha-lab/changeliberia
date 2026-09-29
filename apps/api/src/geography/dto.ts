import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateElectoralDistrictDto {
  @IsString() @MaxLength(120) countyId!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsInt() number?: number;
  @IsOptional() @IsInt() @Min(1) seatCount?: number;
  @IsOptional() @IsString() @MaxLength(200) source?: string;
}

export class UpdateElectoralDistrictDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsInt() number?: number;
  @IsOptional() @IsInt() @Min(1) seatCount?: number;
  @IsOptional() @IsString() @MaxLength(200) source?: string;
}
