/**
 * Input Validation & Sanitization
 * Prevents XSS, injection attacks, and malformed data
 * Works with both frontend form validation and backend input sanitization
 */

export interface ValidationRule {
  type: string;
  message: string;
  validate: (value: unknown) => boolean;
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedSchemes?: string[];
  stripScripts?: boolean;
  stripComments?: boolean;
}

/**
 * XSS attack patterns to detect
 */
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
  /javascript:/gi, // javascript: protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /<iframe/gi, // Iframe tags
  /<object/gi, // Object tags
  /<embed/gi, // Embed tags
  /<applet/gi, // Applet tags
  /vbscript:/gi, // VBScript protocol
  /data:text\/html/gi, // Data URL with HTML
];

/**
 * SQL injection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/gi,
  /(--|#|\/\*|\*\/)/g, // SQL comments
  /(\bOR\b.*?=|;\s*DROP)/gi, // OR conditions and DROP
];

/**
 * Email validation regex (simplified RFC 5322)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex
 */
const URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Common whitelist for allowed HTML tags
 */
export const ALLOWED_HTML_TAGS = {
  basic: ['b', 'i', 'em', 'strong', 'p', 'br', 'hr'],
  rich: ['b', 'i', 'em', 'strong', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
  strict: ['b', 'i', 'em', 'strong', 'p', 'br'],
};

/**
 * Whitelist of safe attributes
 */
export const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'rel', 'target'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  video: ['src', 'controls', 'width', 'height'],
  iframe: ['src', 'width', 'height', 'frameborder'], // Use carefully
};

/**
 * Safe URL schemes
 */
export const SAFE_URL_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/**
 * Check if string contains XSS attempt
 */
export function containsXSSAttempt(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const lowerValue = value.toLowerCase();
  return XSS_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0; // Reset regex
    return pattern.test(lowerValue);
  });
}

/**
 * Check if string contains SQL injection attempt
 */
export function containsSQLInjection(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  return SQL_INJECTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(
  html: string,
  options: SanitizationOptions = {}
): string {
  let result = html;

  // Remove scripts
  if (options.stripScripts !== false) {
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  }

  // Remove comments
  if (options.stripComments !== false) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove event handlers
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Decode HTML entities
  result = decodeHTMLEntities(result);

  // Remove disallowed tags
  const allowedTags = options.allowedTags || ALLOWED_HTML_TAGS.strict;
  if (allowedTags.length > 0) {
    const tagPattern = new RegExp(
      `<(?!\/?(?:${allowedTags.join('|')})[> \t])/?[^>]*>`,
      'gi'
    );
    result = result.replace(tagPattern, '');
  }

  return result.trim();
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeURL(url: string): string | null {
  try {
    const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.href : 'https://example.com');
    const protocol = urlObj.protocol.replace(':', '');

    if (!SAFE_URL_SCHEMES.includes(protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Decode HTML entities
 */
export function decodeHTMLEntities(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
  }

  // Client-side
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return URL_REGEX.test(url);
  } catch {
    return false;
  }
}

/**
 * Validate strong password
 */
export function validatePassword(password: string): {
  valid: boolean;
  score: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length < 8) {
    suggestions.push('Password must be at least 8 characters');
  } else {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include numbers');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include special characters');
  }

  // Check for common patterns
  const commonPatterns = ['password', 'admin', '123456', 'qwerty', 'letmein'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    suggestions.push('Avoid common passwords');
    score = Math.max(0, score - 2);
  }

  return {
    valid: score >= 4,
    score: Math.min(5, Math.max(0, score)),
    suggestions,
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let result = filename.replace(/\.\./g, '').replace(/[/\\]/g, '');

  // Remove unsafe characters
  result = result.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Replace spaces with underscores
  result = result.replace(/\s+/g, '_');

  // Limit length
  return result.slice(0, 255);
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedMimes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedMimes = options.allowedMimes || ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = options.allowedExtensions || ['jpg', 'jpeg', 'png', 'webp'];

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension .${ext} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive input validator
 */
export class InputValidator {
  private rules: ValidationRule[] = [];

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Validate XSS
   */
  preventXSS(): this {
    return this.addRule({
      type: 'xss',
      message: 'Input contains potentially malicious content',
      validate: (value) => !containsXSSAttempt(value),
    });
  }

  /**
   * Validate SQL injection
   */
  preventSQLInjection(): this {
    return this.addRule({
      type: 'sql-injection',
      message: 'Input contains potentially malicious SQL',
      validate: (value) => !containsSQLInjection(value),
    });
  }

  /**
   * Validate required field
   */
  required(): this {
    return this.addRule({
      type: 'required',
      message: 'This field is required',
      validate: (value) => {
        if (typeof value === 'string') return value.trim().length > 0;
        return value !== null && value !== undefined;
      },
    });
  }

  /**
   * Validate minimum length
   */
  minLength(length: number): this {
    return this.addRule({
      type: 'min-length',
      message: `Minimum length is ${length} characters`,
      validate: (value) =>
        typeof value === 'string' ? value.length >= length : false,
    });
  }

  /**
   * Validate maximum length
   */
  maxLength(length: number): this {
    return this.addRule({
      type: 'max-length',
      message: `Maximum length is ${length} characters`,
      validate: (value) =>
        typeof value === 'string' ? value.length <= length : true,
    });
  }

  /**
   * Run all validations
   */
  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default {
  containsXSSAttempt,
  containsSQLInjection,
  sanitizeHTML,
  sanitizeURL,
  escapeHTML,
  decodeHTMLEntities,
  validateEmail,
  validateURL,
  validatePassword,
  sanitizeFilename,
  validateFileUpload,
  InputValidator,
  ALLOWED_HTML_TAGS,
  ALLOWED_ATTRIBUTES,
  SAFE_URL_SCHEMES,
};
