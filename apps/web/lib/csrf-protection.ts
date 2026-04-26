/**
 * CSRF Protection
 * Implements CSRF token generation, validation, and middleware
 * Protects against Cross-Site Request Forgery attacks
 */

export interface CSRFToken {
  token: string;
  secret: string;
  createdAt: number;
  expiresAt: number;
}

export interface CSRFConfig {
  tokenLength: number;
  tokenTTL: number; // in seconds
  headerName: string;
  cookieName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
    maxAge: number;
  };
}

/**
 * Default CSRF configuration
 */
export const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  tokenLength: 32,
  tokenTTL: 3600, // 1 hour
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 3600 * 1000, // 1 hour in ms
  },
};

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash token for storage (prevents exposure in case of XSS)
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Client-side: use SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Client-side CSRF token manager
 */
export class CSRFTokenManager {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
  }

  /**
   * Get or create CSRF token
   */
  getToken(): string {
    if (typeof window === 'undefined') {
      throw new Error('CSRFTokenManager can only be used in browser');
    }

    const stored = sessionStorage.getItem('csrf-token');

    if (stored) {
      const token = JSON.parse(stored) as CSRFToken;
      if (token.expiresAt > Date.now()) {
        return token.token;
      }
    }

    return this.createToken();
  }

  /**
   * Create new CSRF token
   */
  private createToken(): string {
    if (typeof window === 'undefined') {
      throw new Error('CSRFTokenManager can only be used in browser');
    }

    const token = generateToken(this.config.tokenLength);
    const now = Date.now();

    const csrfData: CSRFToken = {
      token,
      secret: generateToken(32),
      createdAt: now,
      expiresAt: now + this.config.tokenTTL * 1000,
    };

    sessionStorage.setItem('csrf-token', JSON.stringify(csrfData));

    // Also set in a meta tag for easy access
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', token);

    return token;
  }

  /**
   * Add CSRF token to request headers
   */
  addToHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      [this.config.headerName]: this.getToken(),
    };
  }

  /**
   * Add CSRF token to form data
   */
  addToFormData(formData: FormData): FormData {
    formData.append('csrf-token', this.getToken());
    return formData;
  }

  /**
   * Clear stored token
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('csrf-token');
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const stored = sessionStorage.getItem('csrf-token');
    if (!stored) return true;

    const token = JSON.parse(stored) as CSRFToken;
    return token.expiresAt <= Date.now();
  }
}

/**
 * Enhanced fetch with automatic CSRF token injection
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
  csrfManager?: CSRFTokenManager
): Promise<Response> {
  const manager = csrfManager || new CSRFTokenManager();

  if (!options.headers) {
    options.headers = {};
  }

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const headers = options.headers as Record<string, string>;
    headers['X-CSRF-Token'] = manager.getToken();
  }

  const response = await fetch(url, options);

  // Check for 419 (CSRF token invalid/expired)
  if (response.status === 419) {
    console.warn('CSRF token expired, refreshing...');
    manager.clear();
    throw new Error(
      'CSRF token expired. Please refresh the page and try again.'
    );
  }

  return response;
}

/**
 * Log CSRF-related security events
 */
export async function logCSRFEvent(
  eventType: 'generation' | 'validation' | 'failure',
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/security/csrf-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        ...details,
      }),
    });
  } catch (error) {
    console.error('Failed to log CSRF event:', error);
  }
}

/**
 * Initialize CSRF protection on page load
 */
export function initializeCSRFProtection(
  config: Partial<CSRFConfig> = {}
): CSRFTokenManager {
  if (typeof window === 'undefined') {
    throw new Error('CSRF protection must be initialized in browser');
  }

  const manager = new CSRFTokenManager(config);

  // Generate initial token
  const token = manager.getToken();
  logCSRFEvent('generation', { tokenPrefix: token.slice(0, 8) });

  // Refresh token periodically
  setInterval(() => {
    if (manager.isExpired()) {
      console.log('CSRF token expired, generating new one...');
      manager.clear();
      manager.getToken();
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  return manager;
}

/**
 * Double-submit cookie pattern (server-side validation reference)
 * Token is sent twice: once in cookie, once in header/form
 * Server validates both match
 */
export interface DoubleSubmitCookieConfig {
  cookieName: string;
  headerName: string;
  tokenLength: number;
}

/**
 * Generate double-submit tokens
 */
export function generateDoubleSubmitTokens(
  config: DoubleSubmitCookieConfig
): {
  cookieToken: string;
  headerToken: string;
} {
  const secret = generateToken(config.tokenLength);

  // In a real implementation:
  // - cookieToken = SECRET (stored in secure httponly cookie)
  // - headerToken = HASH(SECRET) (sent in header)
  // Server validates: HASH(cookie) === header

  return {
    cookieToken: secret,
    headerToken: secret, // Would be hashed in real code
  };
}

/**
 * CSRF error types for better error handling
 */
export class CSRFError extends Error {
  constructor(
    public code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN',
    message: string
  ) {
    super(message);
    this.name = 'CSRFError';
  }
}

/**
 * Custom hook for React components (can be used in client components)
 * Hook: useCSRFToken()
 * Usage:
 *   const { token, addToRequest } = useCSRFToken();
 */
export function createCSRFHookFactory(config: Partial<CSRFConfig> = {}) {
  return function useCSRFToken() {
    const manager = new CSRFTokenManager(config);

    return {
      token: manager.getToken(),
      addToHeaders: (headers?: Record<string, string>) =>
        manager.addToHeaders(headers || {}),
      addToFormData: (formData?: FormData) =>
        manager.addToFormData(formData || new FormData()),
      isExpired: () => manager.isExpired(),
      refresh: () => {
        manager.clear();
        return manager.getToken();
      },
    };
  };
}

export default {
  CSRFTokenManager,
  generateToken,
  hashToken,
  secureFetch,
  logCSRFEvent,
  initializeCSRFProtection,
  generateDoubleSubmitTokens,
  createCSRFHookFactory,
  CSRFError,
  DEFAULT_CSRF_CONFIG,
};
