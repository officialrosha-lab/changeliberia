import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { CSRF_TOKEN_COOKIE } from './cookie.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Raw-body webhook routes are never browser-originated and can't carry a
// CSRF cookie/header pair — they're already protected by their own HMAC
// signature verification (see rawBodyMiddleware + each webhook handler).
const EXEMPT_PATH_PREFIXES = ['/api/v1/payments/webhook', '/api/v1/webhooks/'];

/**
 * Double-submit CSRF guard, applied globally. A request is only required
 * to present a matching X-CSRF-Token header when it's already carrying the
 * csrf_token cookie — i.e. when it's using cookie-based auth. Bearer-token
 * API clients (which never receive that cookie) are unaffected, since
 * CSRF specifically exploits the browser's automatic cookie attachment.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;
    if (EXEMPT_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
      return true;
    }

    const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE] as string | undefined;
    if (!cookieToken) return true;

    const headerToken = req.get('x-csrf-token');
    if (!headerToken || headerToken !== cookieToken) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    return true;
  }
}
