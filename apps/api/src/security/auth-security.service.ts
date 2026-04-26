/**
 * Authentication Security Service
 * JWT validation, session security, password hashing, and auth event logging
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthSecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  maxLoginAttempts: number;
  lockoutDuration: number; // in milliseconds
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
}

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  valid: boolean;
}

export interface SessionSecurityInfo {
  userId: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
}

export interface AuthEvent {
  type: 'login' | 'logout' | 'password_change' | 'failed_attempt' | 'token_refresh';
  userId: string;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}

/**
 * Default auth security configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthSecurityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'change-liberia-secret-key-change-in-production',
  jwtExpiresIn: '1h',
  refreshTokenExpiresIn: '7d',
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
};

@Injectable()
export class AuthSecurityService {
  private config: AuthSecurityConfig;
  private loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();
  private authEvents: AuthEvent[] = [];
  private crypto = require('crypto');

  constructor(
    private jwtService: JwtService,
    configService: ConfigService
  ) {
    this.config = {
      ...DEFAULT_AUTH_CONFIG,
      jwtSecret: configService.get('JWT_SECRET') || DEFAULT_AUTH_CONFIG.jwtSecret,
    };

    // Cleanup old events every hour
    setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1000);
  }

  /**
   * Hash password using bcrypt algorithm
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 12; // Increase cost factor
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.config.passwordMinLength) {
      feedback.push(
        `Password must be at least ${this.config.passwordMinLength} characters`
      );
    } else {
      score += 1;
    }

    if (password.length >= 16) {
      score += 1;
    }

    // Uppercase check
    if (this.config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Include uppercase letters');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Numbers check
    if (this.config.passwordRequireNumbers && !/[0-9]/.test(password)) {
      feedback.push('Include numbers');
    } else if (/[0-9]/.test(password)) {
      score += 1;
    }

    // Special characters check
    if (this.config.passwordRequireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Include special characters');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Common patterns check
    const commonPatterns = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'letmein',
      'welcome',
      'passw0rd',
    ];

    if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
      feedback.push('Avoid common passwords');
      score = Math.max(0, score - 2);
    }

    // Check for sequential characters
    if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password
    )) {
      feedback.push('Avoid sequential characters');
      score = Math.max(0, score - 1);
    }

    return {
      score: Math.min(5, Math.max(0, score)),
      feedback,
      valid: score >= 3 && feedback.length === 0,
    };
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload as any, {
      expiresIn: this.config.refreshTokenExpiresIn,
    } as any);
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload as any, {
      expiresIn: this.config.jwtExpiresIn,
    } as any);
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): Record<string, unknown> | null {
    try {
      return this.jwtService.verify(token) as any;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Check if user is locked out due to failed login attempts
   */
  isLockedOut(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId);

    if (!attempts) return false;

    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      return true;
    }

    // Clear lock if expired
    if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
      this.loginAttempts.delete(userId);
      return false;
    }

    return false;
  }

  /**
   * Get minutes until lockout expires
   */
  getLockoutMinutesRemaining(userId: string): number {
    const attempts = this.loginAttempts.get(userId);

    if (!attempts?.lockedUntil) return 0;

    const remaining = attempts.lockedUntil - Date.now();
    return Math.ceil(remaining / 60000);
  }

  /**
   * Record failed login attempt
   */
  recordFailedLoginAttempt(userId: string): void {
    const attempts = this.loginAttempts.get(userId) || { count: 0 };
    attempts.count++;

    if (attempts.count >= this.config.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + this.config.lockoutDuration;
    }

    this.loginAttempts.set(userId, attempts);

    // Log security event
    this.logAuthEvent({
      type: 'failed_attempt',
      userId,
      success: false,
      reason: `Failed attempt ${attempts.count}/${this.config.maxLoginAttempts}`,
      timestamp: Date.now(),
      ipAddress: 'unknown',
      userAgent: 'unknown',
    });
  }

  /**
   * Clear login attempts after successful login
   */
  clearLoginAttempts(userId: string): void {
    this.loginAttempts.delete(userId);
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event: AuthEvent): void {
    this.authEvents.push(event);

    // Log to console for alerts
    if (!event.success) {
      console.warn(
        `[AUTH] ${event.type} failed for user ${event.userId}: ${event.reason}`
      );
    }
  }

  /**
   * Get authentication events for a user
   */
  getAuthEvents(userId: string, hours: number = 24): AuthEvent[] {
    const since = Date.now() - hours * 60 * 60 * 1000;
    return this.authEvents.filter(
      (e) => e.userId === userId && e.timestamp > since
    );
  }

  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity(userId: string): {
    suspicious: boolean;
    reasons: string[];
    risk: 'low' | 'medium' | 'high';
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    const events = this.getAuthEvents(userId, 24);

    // Check for multiple failed attempts
    const failedAttempts = events.filter((e) => !e.success).length;
    if (failedAttempts >= 3) {
      reasons.push(`${failedAttempts} failed login attempts in 24 hours`);
      riskScore += 2;
    }

    // Check for logins from different IPs
    const uniqueIPs = new Set(events.map((e) => e.ipAddress)).size;
    if (uniqueIPs >= 3) {
      reasons.push(`Logins from ${uniqueIPs} different IP addresses`);
      riskScore += 1;
    }

    // Check for rapid successive logins
    const loginTimes = events
      .filter((e) => e.type === 'login' && e.success)
      .map((e) => e.timestamp);

    for (let i = 1; i < loginTimes.length; i++) {
      if (loginTimes[i] - loginTimes[i - 1] < 60000) {
        reasons.push('Multiple logins within 1 minute');
        riskScore += 2;
        break;
      }
    }

    // Check for password changes followed by logins
    const passwordChanges = events.filter((e) => e.type === 'password_change');
    if (passwordChanges.length > 0) {
      const lastPasswordChange = passwordChanges[passwordChanges.length - 1];
      const loginsAfter = events.filter(
        (e) => e.type === 'login' && e.timestamp > lastPasswordChange.timestamp
      );
      if (loginsAfter.length >= 2) {
        reasons.push('Multiple logins after password change');
        riskScore += 1;
      }
    }

    let risk: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 4) risk = 'high';
    else if (riskScore >= 2) risk = 'medium';

    return {
      suspicious: reasons.length > 0,
      reasons,
      risk,
    };
  }

  /**
   * Generate session ID for tracking
   */
  generateSessionId(): string {
    return this.crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get session security info
   */
  getSessionSecurityInfo(
    userId: string,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    deviceId?: string
  ): SessionSecurityInfo {
    const now = Date.now();
    const expiresIn = 3600 * 1000; // 1 hour

    return {
      userId,
      sessionId,
      issuedAt: now,
      expiresAt: now + expiresIn,
      ipAddress,
      userAgent,
      deviceId,
    };
  }

  /**
   * Cleanup old events
   */
  private cleanupOldEvents(): void {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = Date.now() - maxAge;

    this.authEvents = this.authEvents.filter((e) => e.timestamp > cutoff);
  }

  /**
   * Generate secure random token (for password reset, email verification, etc.)
   */
  generateSecureToken(length: number = 32): string {
    return this.crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash token for storage
   */
  hashSecureToken(token: string): string {
    return this.crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validate token format (basic check)
   */
  validateTokenFormat(token: string): boolean {
    // Token should be a hex string of appropriate length
    return /^[a-f0-9]{64,}$/.test(token);
  }
}

export default {
  AuthSecurityService,
  DEFAULT_AUTH_CONFIG,
};
