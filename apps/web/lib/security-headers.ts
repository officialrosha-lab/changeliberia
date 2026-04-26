/**
 * Security Headers Configuration
 * Implements HTTP security headers and Content Security Policy (CSP)
 * Protects against common web vulnerabilities: XSS, Clickjacking, MIME-sniffing, etc.
 */

export interface SecurityHeadersConfig {
  cspEnabled: boolean;
  hsts: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXssProtection: string;
  referrerPolicy: string;
  permissionPolicy: string;
}

/**
 * Content Security Policy (CSP) configuration
 * Restricts resource loading to prevent XSS attacks
 */
export const CSP_DIRECTIVES = {
  /* Default fallback for all source types */
  'default-src': ["'self'"],

  /* Script sources - only from our domain and trusted CDNs */
  'script-src': [
    "'self'",
    'https://cdn.jsdelivr.net', // For libraries
    'https://cdn.stripe.com', // Stripe
    'https://challenges.cloudflare.com', // Cloudflare challenges
    'https://embed.tiktok.com',
    'https://www.youtube.com',
  ],

  /* Style sources */
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Needed for Tailwind and inline styles
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com',
  ],

  /* Font sources */
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],

  /* Image sources */
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:', // For canvas images
  ],

  /* Media sources */
  'media-src': ["'self'", 'https:', 'data:', 'blob:'],

  /* Frame/embed sources */
  'frame-src': [
    "'self'",
    'https://www.youtube.com',
    'https://player.vimeo.com',
    'https://js.stripe.com',
    'https://challenges.cloudflare.com',
  ],

  /* Connect sources (API, WebSocket, etc.) */
  'connect-src': [
    "'self'",
    'https:',
    'wss:', // WebSocket secure
  ],

  /* Form submission targets */
  'form-action': ["'self'"],

  /* Frame ancestors (clickjacking protection) */
  'frame-ancestors': ["'none'"],

  /* Base URI restriction */
  'base-uri': ["'self'"],

  /* Object sources */
  'object-src': ["'none'"],

  /* Worker/manifest sources */
  'worker-src': ["'self'"],

  /* Report URI for CSP violations */
  'report-uri': ['/api/security/csp-report'],

  /* Upgrade insecure requests to HTTPS */
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string from directives
 */
export function generateCSPHeader(directives: Record<string, string[]> = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key; // For directives without values
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Default security headers configuration
 */
export const SECURITY_HEADERS: SecurityHeadersConfig = {
  cspEnabled: true,
  /* HSTS - Force HTTPS */
  hsts: 'max-age=31536000; includeSubDomains; preload',
  /* X-Frame-Options - Prevent clickjacking */
  xFrameOptions: 'DENY',
  /* X-Content-Type-Options - Prevent MIME-sniffing */
  xContentTypeOptions: 'nosniff',
  /* X-XSS-Protection - Legacy XSS protection */
  xXssProtection: '1; mode=block',
  /* Referrer-Policy - Control referrer information */
  referrerPolicy: 'strict-origin-when-cross-origin',
  /* Permissions-Policy - Control browser features */
  permissionPolicy:
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
};

/**
 * Get all security headers as key-value pairs
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = SECURITY_HEADERS): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (config.cspEnabled) {
    headers['Content-Security-Policy'] = generateCSPHeader();
  }
  
  headers['Strict-Transport-Security'] = config.hsts;
  headers['X-Frame-Options'] = config.xFrameOptions;
  headers['X-Content-Type-Options'] = config.xContentTypeOptions;
  headers['X-XSS-Protection'] = config.xXssProtection;
  headers['Referrer-Policy'] = config.referrerPolicy;
  headers['Permissions-Policy'] = config.permissionPolicy;
  headers['X-UA-Compatible'] = 'IE=edge';
  
  if (config.cspEnabled) {
    headers['X-Content-Security-Policy'] = generateCSPHeader();
  }
  
  return headers;
}

/**
 * Parse CSP violations from report
 */
export interface CSPViolation {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'source-file': string;
  'line-number': number;
  'column-number': number;
  disposition: 'enforce' | 'report';
}

/**
 * Parse and validate CSP violation report
 */
export function parseCSPViolation(body: unknown): CSPViolation | null {
  try {
    const data = body as Record<string, any>;
    const violation = data['csp-report'];

    if (!violation) return null;

    return {
      'document-uri': violation['document-uri'] || '',
      'violated-directive': violation['violated-directive'] || '',
      'effective-directive': violation['effective-directive'] || '',
      'original-policy': violation['original-policy'] || '',
      'blocked-uri': violation['blocked-uri'] || '',
      'source-file': violation['source-file'] || '',
      'line-number': violation['line-number'] || 0,
      'column-number': violation['column-number'] || 0,
      disposition: violation['disposition'] || 'enforce',
    };
  } catch (error) {
    console.error('Failed to parse CSP violation:', error);
    return null;
  }
}

/**
 * Apply security headers to response (for Next.js middleware)
 */
export function applySecurityHeaders(
  headers: Headers,
  config: SecurityHeadersConfig = SECURITY_HEADERS
): void {
  const securityHeaders = getSecurityHeaders(config);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value !== undefined) {
      headers.set(key, value);
    }
  });
}

/**
 * Nonce generator for inline scripts/styles in CSP
 */
export function generateNonce(): string {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Get nonce from meta tag (set by Next.js middleware)
 */
export function getNonce(): string | null {
  if (typeof window === 'undefined') return null;

  const meta = document.querySelector('meta[property="csp-nonce"]');
  return meta?.getAttribute('content') || null;
}

/**
 * Check if a URL is safe (not javascript: or data: protocol)
 */
export function isSafeURL(url: unknown): boolean {
  if (typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url, window.location.href);
    return /^(https?|ftp):$/.test(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Security event logger
 */
export interface SecurityEvent {
  type: 'csp-violation' | 'xss-attempt' | 'auth-failure' | 'rate-limit' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log security events
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await fetch('/api/security/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || Date.now(),
      }),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Initialize security monitoring
 */
export function initializeSecurityMonitoring(): void {
  if (typeof window === 'undefined') return;

  /* Monitor CSP violations */
  document.addEventListener('securitypolicyviolation', (event) => {
    logSecurityEvent({
      type: 'csp-violation',
      severity: 'high',
      message: `CSP violation: ${event.violatedDirective}`,
      timestamp: Date.now(),
      metadata: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
      },
    });
  });

  /* Monitor unhandled errors (potential XSS) */
  window.addEventListener('error', (event) => {
    if (event.message.includes('Unexpected token') || event.message.includes('malformed')) {
      logSecurityEvent({
        type: 'xss-attempt',
        severity: 'medium',
        message: event.message,
        timestamp: Date.now(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }
  });
}

export default {
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  generateCSPHeader,
  getSecurityHeaders,
  applySecurityHeaders,
  parseCSPViolation,
  generateNonce,
  getNonce,
  isSafeURL,
  logSecurityEvent,
  initializeSecurityMonitoring,
};
