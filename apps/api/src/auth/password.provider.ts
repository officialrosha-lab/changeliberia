import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Password Provider
 * Handles password hashing and verification using bcrypt
 * Standard security: 10 salt rounds
 */
@Injectable()
export class PasswordProvider {
  private readonly saltRounds = 10;

  /**
   * Hash a plain text password
   * @param password Plain text password to hash
   * @returns Hashed password (bcrypt hash)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a plain text password against a hashed password
   * @param password Plain text password to verify
   * @param hash Bcrypt hash to compare against
   * @returns true if password matches hash, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least one uppercase, one lowercase, one number
   * @param password Password to validate
   * @returns Object with isValid boolean and message if invalid
   */
  validatePasswordStrength(
    password: string,
  ): { isValid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    return { isValid: true };
  }
}
