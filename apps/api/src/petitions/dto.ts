import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePetitionDto {
  @IsString() title!: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsString() summary!: string;
  @IsString() description!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsInt() @Min(100) goal?: number;
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
