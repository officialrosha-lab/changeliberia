import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Authenticates Vercel Cron invocations. Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on scheduled requests when the
 * CRON_SECRET env var is set on the project — see vercel.json's `crons`.
 */
@Injectable()
export class CronAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new UnauthorizedException('CRON_SECRET is not configured');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (header !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return true;
  }
}
