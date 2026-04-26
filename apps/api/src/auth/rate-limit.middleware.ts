import { Injectable, BadRequestException } from '@nestjs/common';
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
      ...config,
    };

    // Cleanup old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const entry = this.requests.get(key);

    // Initialize or reset if window expired
    if (!entry || entry.resetTime < now) {
      this.requests.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return next();
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      throw new BadRequestException(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
      );
    }

    next();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Create rate limit middleware for specific endpoint
 */
export function createRateLimiter(config: RateLimitConfig) {
  return new RateLimitMiddleware(config);
}
