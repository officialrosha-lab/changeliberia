/**
 * Security Middleware for NestJS API
 * Implements CORS, CSRF validation, rate limiting, and security headers
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface CORSConfig {
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export interface SecurityConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  enableCORS: boolean;
  enableSecurityHeaders: boolean;
  csrfExcludePaths?: string[];
  rateLimitConfig?: RateLimitConfig;
  corsConfig?: CORSConfig;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSRF: true,
  enableRateLimit: true,
  enableCORS: true,
  enableSecurityHeaders: true,
  csrfExcludePaths: ['/api/health', '/api/auth/login', '/api/auth/refresh'],
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  corsConfig: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
    maxAge: 3600,
  },
};

/**
 * Store for rate limiting (simple in-memory, use Redis for production)
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  isLimited(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      // Reset window
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (record.count >= maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * CORS Middleware
 */
@Injectable()
export class CORSMiddleware implements NestMiddleware {
  constructor(private config: CORSConfig = DEFAULT_SECURITY_CONFIG.corsConfig!) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.get('origin') || '';

    // Check if origin is allowed
    if (this.config.origins.includes(origin) || this.config.origins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', this.config.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', String(this.config.credentials));
    res.setHeader('Access-Control-Max-Age', String(this.config.maxAge));

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  }
}

/**
 * CSRF Middleware
 */
@Injectable()
export class CSRFMiddleware implements NestMiddleware {
  private csrfTokens = new Map<string, { token: string; createdAt: number }>();

  constructor(
    private config: CORSConfig = DEFAULT_SECURITY_CONFIG.corsConfig!,
  ) {
    // Cleanup expired tokens every 5 minutes
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const method = req.method.toUpperCase();

    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }

    // Get CSRF token from header or body
    const token =
      req.get('X-CSRF-Token') || req.get('csrf-token') || req.body?.['csrf-token'];

    if (!token) {
      throw new HttpException('CSRF token missing', HttpStatus.BAD_REQUEST);
    }

    // Validate token
    if (!this.validateToken(token)) {
      throw new HttpException('Invalid or expired CSRF token', HttpStatus.FORBIDDEN);
    }

    next();
  }

  generateToken(sessionId: string): string {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    this.csrfTokens.set(sessionId, {
      token,
      createdAt: Date.now(),
    });

    return token;
  }

  private validateToken(token: string): boolean {
    // Token validation logic
    return !!(token && token.length === 64);
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    const maxAge = 3600 * 1000; // 1 hour

    for (const [sessionId, { createdAt }] of this.csrfTokens.entries()) {
      if (now - createdAt > maxAge) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }
}

/**
 * Rate Limiting Middleware
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private config: RateLimitConfig = DEFAULT_SECURITY_CONFIG.rateLimitConfig!) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.getClientKey(req);

    if (rateLimitStore.isLimited(key, this.config.maxRequests, this.config.windowMs)) {
      res.status(429);
      res.setHeader('Retry-After', Math.ceil(this.config.windowMs / 1000));
      throw new HttpException(
        this.config.message || 'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    next();
  }

  private getClientKey(req: Request): string {
    // Try to get real IP from headers (for proxied requests)
    const forwarded = req.get('X-Forwarded-For');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';

    return `${ip}:${userId}`;
  }
}

/**
 * Security Headers Middleware
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // HSTS - Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
    );

    // CSP Header
    const csp =
      "default-src 'self'; " +
      "script-src 'self' https://cdn.jsdelivr.net https://cdn.stripe.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;";

    res.setHeader('Content-Security-Policy', csp);

    // Remove server info
    res.removeHeader('Server');
    res.removeHeader('X-Powered-By');

    next();
  }
}

/**
 * Input Validation Middleware
 */
@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const XSS_PATTERNS = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
    ];

    // Check request body
    if (req.body) {
      const bodyStr = JSON.stringify(req.body);

      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(bodyStr)) {
          throw new HttpException('Request contains invalid content', HttpStatus.BAD_REQUEST);
        }
      }
    }

    // Check query parameters
    const queryStr = JSON.stringify(req.query);

    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(queryStr)) {
        throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
      }
    }

    next();
  }
}

/**
 * Request Logging Middleware (for security events)
 */
@Injectable()
export class SecurityLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Log security-relevant events
    const method = req.method;
    const path = req.path;
    const userId = (req as any).user?.id || 'anonymous';
    const ip = this.getClientIP(req);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;

      // Log failed auth attempts
      if (status === 401 || status === 403) {
        console.warn(
          `[SECURITY] ${method} ${path} [${status}] User: ${userId} IP: ${ip} Duration: ${duration}ms`
        );
      }

      // Log rate limit hits
      if (status === 429) {
        console.warn(`[RATE-LIMIT] IP: ${ip} Duration: ${duration}ms`);
      }

      // Log slow requests (potential DDoS)
      if (duration > 30000) {
        console.warn(`[SLOW-REQUEST] ${method} ${path} Duration: ${duration}ms`);
      }
    });

    next();
  }

  private getClientIP(req: Request): string {
    const forwarded = req.get('X-Forwarded-For');
    return forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
  }
}

/**
 * Helper function to apply all security middleware to app
 */
export function applySecurityMiddleware(
  app: any,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): void {
  if (config.enableSecurityHeaders) {
    app.use(new SecurityHeadersMiddleware());
  }

  if (config.enableCORS) {
    app.use(new CORSMiddleware(config.corsConfig));
  }

  if (config.enableRateLimit) {
    app.use(new RateLimitMiddleware(config.rateLimitConfig));
  }

  if (config.enableCSRF) {
    app.use(new CSRFMiddleware(config.corsConfig));
  }

  app.use(new InputValidationMiddleware());
  app.use(new SecurityLoggingMiddleware());
}

export default {
  CORSMiddleware,
  CSRFMiddleware,
  RateLimitMiddleware,
  SecurityHeadersMiddleware,
  InputValidationMiddleware,
  SecurityLoggingMiddleware,
  applySecurityMiddleware,
  DEFAULT_SECURITY_CONFIG,
};
