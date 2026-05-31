import { IsString, IsOptional } from 'class-validator';

export class CastVoteDto {
  @IsString()
  optionId!: string;

  @IsOptional()
  @IsString()
  userId?: string; // Optional - for logged-in users
}
