import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';

// Scoped to /auth so logout/refresh can read it without exposing it to
// every other route — narrower than the access token, which needs to be
// sent with every authenticated request.
export const AUTH_COOKIE_PATH = '/api/v1/auth';

const ACCESS_TOKEN_MAX_AGE_MS = 20 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Sets the access/refresh/csrf cookie trio after a successful login,
 * signup verification, or token refresh. Cookies are httpOnly except the
 * CSRF token, which client JS must read and echo back in a header.
 */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
  res.cookie(CSRF_TOKEN_COOKIE, randomBytes(16).toString('hex'), {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

/** Clears all three auth cookies on logout. */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: AUTH_COOKIE_PATH });
  res.clearCookie(CSRF_TOKEN_COOKIE, { path: '/' });
}

/**
 * Reads the access token from the httpOnly cookie, falling back to a
 * Bearer header for non-browser API clients that don't carry cookies.
 */
export function extractJwtFromRequest(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (fromCookie) return fromCookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
