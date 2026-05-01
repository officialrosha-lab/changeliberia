import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { SupportersService } from './supporters.service';

class JoinDto {
  @IsString() sessionId!: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() source?: string;
}

class UpdateContactDto {
  @IsString() sessionId!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

@Controller('supporters')
export class SupportersController {
  constructor(private readonly service: SupportersService) {}

  @Get('count')
  count() {
    return this.service.getCount();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('join')
  join(@Body() body: JoinDto) {
    return this.service.join(body.sessionId, body.userId, body.source);
  }

  @Post('update-contact')
  updateContact(@Body() body: UpdateContactDto) {
    return this.service.updateContact(body.sessionId, body.email, body.phone);
  }
}
