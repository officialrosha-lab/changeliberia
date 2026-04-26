/**
 * Encryption Service
 * Encrypts/decrypts sensitive data like payment info, personal documents, etc.
 * Uses AES-256-GCM for authenticated encryption
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EncryptionConfig {
  algorithm: string;
  encryptionKey: string;
  keyDerivation: 'pbkdf2' | 'scrypt';
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

@Injectable()
export class EncryptionService {
  private cipher = require('crypto');
  private config: EncryptionConfig;
  private encryptionKey: Buffer;

  constructor(configService: ConfigService) {
    const encryptionKey = configService.get('ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }

    this.config = {
      algorithm: 'aes-256-gcm',
      encryptionKey,
      keyDerivation: 'pbkdf2',
    };

    // Derive encryption key from master key
    this.encryptionKey = this.deriveKey(encryptionKey);
  }

  /**
   * Derive encryption key from master key
   */
  private deriveKey(masterKey: string): Buffer {
    const crypto = require('crypto');

    if (this.config.keyDerivation === 'pbkdf2') {
      return crypto.pbkdf2Sync(
        masterKey,
        'change-liberia-salt', // Use a static salt for consistency, ideally store per-user
        100000,
        32,
        'sha256'
      );
    }

    // Fallback to simple derivation if needed
    return crypto.createHash('sha256').update(masterKey).digest();
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string, additionalData?: string): EncryptedData {
    try {
      // Generate random IV
      const iv = this.cipher.randomBytes(16);

      // Create cipher
      const cipher = this.cipher.createCipheriv(
        this.config.algorithm,
        this.encryptionKey,
        iv
      );

      // Add additional authenticated data if provided
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.config.algorithm,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptedData, additionalData?: string): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      // Create decipher
      const decipher = this.cipher.createDecipheriv(
        encryptedData.algorithm,
        this.encryptionKey,
        iv
      );

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Add additional authenticated data if provided
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }

      // Decrypt data
      let plaintext = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Encrypt object to JSON
   */
  encryptObject<T extends Record<string, unknown>>(
    obj: T,
    additionalData?: string
  ): EncryptedData {
    const json = JSON.stringify(obj);
    return this.encrypt(json, additionalData);
  }

  /**
   * Decrypt JSON to object
   */
  decryptObject<T extends Record<string, unknown>>(
    encryptedData: EncryptedData,
    additionalData?: string
  ): T {
    const plaintext = this.decrypt(encryptedData, additionalData);
    return JSON.parse(plaintext) as T;
  }

  /**
   * Hash value (one-way, for comparison)
   */
  hash(value: string, iterations: number = 100000): string {
    const crypto = require('crypto');
    return crypto
      .pbkdf2Sync(value, 'compare-salt', iterations, 32, 'sha256')
      .toString('hex');
  }

  /**
   * Compare hashed values
   */
  compareHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }

  /**
   * Generate random salt
   */
  generateSalt(length: number = 16): string {
    return this.cipher.randomBytes(length).toString('hex');
  }

  /**
   * Hash with PBKDF2 and specific salt
   */
  hashWithSalt(value: string, salt: string, iterations: number = 100000): string {
    const crypto = require('crypto');
    return crypto
      .pbkdf2Sync(value, salt, iterations, 32, 'sha256')
      .toString('hex');
  }

  /**
   * Encrypt PII (Personally Identifiable Information)
   * Common fields: SSN, passport number, driver license, etc.
   */
  encryptPII(
    field: string,
    value: string
  ): EncryptedData {
    // Use field name as additional authenticated data
    return this.encrypt(value, field);
  }

  /**
   * Decrypt PII
   */
  decryptPII(encryptedData: EncryptedData, field: string): string {
    return this.decrypt(encryptedData, field);
  }

  /**
   * Encrypt payment data
   * Stripe tokens should be encrypted before storing
   */
  encryptPaymentData(
    paymentToken: string,
    userId: string
  ): EncryptedData {
    return this.encrypt(paymentToken, `payment:${userId}`);
  }

  /**
   * Decrypt payment data
   */
  decryptPaymentData(
    encryptedData: EncryptedData,
    userId: string
  ): string {
    return this.decrypt(encryptedData, `payment:${userId}`);
  }

  /**
   * Tokenize sensitive data (replace with non-sensitive token)
   * Useful for logging/monitoring without exposing actual values
   */
  tokenizeSensitiveData(data: string): string {
    const hash = this.cipher.createHash('sha256').update(data).digest().toString('hex');
    return `tok_${hash.slice(0, 20)}`;
  }

  /**
   * Secure wipe (overwrite memory)
   */
  secureWipe(buffer: Buffer): void {
    // Node.js Buffer.fill overwrites memory
    buffer.fill(0);
  }

  /**
   * Create encryption keypair for hybrid encryption (RSA + AES)
   */
  generateKeyPair(): {
    publicKey: string;
    privateKey: string;
  } {
    const crypto = require('crypto');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * Encrypt data with public key (RSA)
   */
  encryptWithPublicKey(plaintext: string, publicKey: string): string {
    const crypto = require('crypto');
    const buffer = Buffer.from(plaintext, 'utf8');

    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );

    return encrypted.toString('base64');
  }

  /**
   * Decrypt data with private key (RSA)
   */
  decryptWithPrivateKey(encrypted: string, privateKey: string): string {
    const crypto = require('crypto');
    const buffer = Buffer.from(encrypted, 'base64');

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );

    return decrypted.toString('utf8');
  }

  /**
   * Generate HMAC signature
   */
  generateSignature(data: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string): boolean {
    const expected = this.generateSignature(data);
    // Use timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(signature, expected);
  }

  /**
   * Timing-safe string comparison (prevents timing attacks)
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    const crypto = require('crypto');
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}

export default {
  EncryptionService,
};
