import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { SupportersService } from './supporters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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

class BroadcastDto {
  @IsString() @MinLength(1) @MaxLength(200) subject!: string;
  @IsString() @MinLength(1) @MaxLength(20000) message!: string;
}

function extractIp(req: Request): string {
  // Railway / Vercel / reverse-proxy set X-Forwarded-For; take the first
  // (leftmost) address which is the original client.
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

function unsubscribePage(body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>Change Liberia</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{font-family:Arial,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#18181b;text-align:center}
a{color:#059669}</style></head>
<body>${body}</body></html>`;
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

  /**
   * Public unsubscribe link sent in outreach emails. Returns a small HTML
   * confirmation page rather than JSON since it's meant to be opened
   * directly by a person clicking the link in their inbox.
   */
  @Get('unsubscribe/:id/:token')
  async unsubscribe(
    @Param('id') id: string,
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const ok = await this.service.unsubscribeByToken(id, token);
    res
      .status(ok ? 200 : 404)
      .type('html')
      .send(
        unsubscribePage(
          ok
            ? '<h1>Unsubscribed</h1><p>You will no longer receive updates from Change Liberia at this address.</p>'
            : '<h1>Link not valid</h1><p>This unsubscribe link is invalid or has expired.</p>',
        ),
      );
  }
}

@Controller('admin/supporters')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSupportersController {
  constructor(private readonly service: SupportersService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.listForAdmin({
      search,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('stats')
  stats() {
    return this.service.getStats();
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('broadcast')
  broadcast(@Body() body: BroadcastDto) {
    return this.service.broadcast(body.subject, body.message);
  }
}
