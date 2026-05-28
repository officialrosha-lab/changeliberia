import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Request } from 'express';
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

function extractIp(req: Request): string {
  // Railway / Vercel / reverse-proxy set X-Forwarded-For; take the first
  // (leftmost) address which is the original client.
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

@Controller('supporters')
export class SupportersController {
  constructor(private readonly service: SupportersService) {}

  @Get('count')
  async count() {
    return this.service.getCount();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('join')
  join(@Body() body: JoinDto, @Req() req: Request) {
    const ip = extractIp(req);
    return this.service.join(body.sessionId, ip, body.userId, body.source);
  }

  @Post('update-contact')
  updateContact(@Body() body: UpdateContactDto) {
    return this.service.updateContact(body.sessionId, body.email, body.phone);
  }
}
