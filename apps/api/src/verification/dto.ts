import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitIdDocumentBodyDto {
  @IsString()
  @MaxLength(80)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fileUrl?: string;
}
