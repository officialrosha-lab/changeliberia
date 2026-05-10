/**
 * Email module constants and configuration
 */

// BullMQ Queue name
export const BULL_EMAIL_QUEUE = 'email-queue';

// Email queue job types
export enum EmailJobType {
  SEND_EMAIL = 'send-email',
  TRACK_OPEN = 'track-open',
  TRACK_CLICK = 'track-click',
  RETRY_FAILED = 'retry-failed',
  PROCESS_DIGEST = 'process-digest',
}

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s initial delay
  },
};

// Default email configuration
export const DEFAULT_EMAIL_CONFIG = {
  FROM_EMAIL: process.env.MAIL_FROM || 'noreply@changeliberia.org',
  FROM_NAME: 'Change Liberia',
  REPLY_TO: process.env.MAIL_REPLY_TO || 'support@changeliberia.org',
  SUPPORT_EMAIL: 'support@changeliberia.org',
};

// Email type mappings for categories
export const EMAIL_CATEGORIES: Record<string, string[]> = {
  AUTHENTICATION: ['WELCOME', 'VERIFY_EMAIL', 'PASSWORD_RESET', 'PASSWORD_RESET_CONFIRMATION'],
  PETITION: [
    'PETITION_APPROVED',
    'PETITION_REJECTED',
    'PETITION_MILESTONE_REACHED',
    'GOVERNMENT_SUBMISSION',
    'OFFICIAL_RESPONSE',
  ],
  COMMUNITY: [
    'WELCOME_TO_MOVEMENT',
    'AMBASSADOR_UPDATE',
    'SIGNATURE_RECEIVED',
    'COMMENT_REPLY',
  ],
  DIGEST: ['WEEKLY_DIGEST'],
  DONATIONS: ['DONATION_RECEIVED'],
};

// Email preferences defaults
export const DEFAULT_EMAIL_PREFERENCES = {
  emailEnabled: true,
  digestFrequency: 'weekly' as const,
  emailCategories: ['PETITION', 'COMMUNITY', 'DIGEST'],
  preferredSendTime: '09:00', // 9 AM
};

// Resend API configuration
export const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY,
  baseUrl: 'https://api.resend.com',
};

// Tracking configuration
export const TRACKING_CONFIG = {
  DOMAIN: process.env.TRACKING_DOMAIN || 'track.changeliberia.org',
  PIXEL_SIZE: 1, // 1x1 pixel
  PIXEL_FORMAT: 'image/gif',
};