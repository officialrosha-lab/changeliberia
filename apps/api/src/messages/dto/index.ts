import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  recipientId!: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}

export class SearchMessagesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class MarkAsReadDto {
  @IsString({ each: true })
  messageIds!: string[];
}
