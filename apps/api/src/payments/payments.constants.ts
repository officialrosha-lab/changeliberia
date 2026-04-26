/**
 * Payment system constants and enumerations
 */

// Payment statuses
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Payment types
export enum PaymentType {
  DONATION = 'DONATION',
  SIGNATURE_FEE = 'SIGNATURE_FEE',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

// Payment methods
export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

// Subscription statuses
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Subscription interval
export enum SubscriptionInterval {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

// Stripe webhook event types that we handle
export enum StripeEventType {
  // Payment Intent events
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED = 'payment_intent.canceled',
  PAYMENT_INTENT_REQUIRES_ACTION = 'payment_intent.requires_action',

  // Subscription events
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',

  // Invoice events
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_PAID = 'invoice.paid',

  // Charge events
  CHARGE_SUCCEEDED = 'charge.succeeded',
  CHARGE_FAILED = 'charge.failed',
  CHARGE_REFUNDED = 'charge.refunded',

  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_DELETED = 'customer.deleted',
}

// Refund reasons
export enum RefundReason {
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  EXPIRED_UNCAPTURED_AUTHORIZATION = 'expired_uncaptured_authorization',
}

// Currency codes
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  LRD = 'LRD', // Liberian Dollar
}

// Payment status transitions
export const VALID_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.CANCELLED],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.REFUNDED]: [],
};

// Stripe webhook events to listen for
export const STRIPE_WEBHOOK_EVENTS = [
  StripeEventType.PAYMENT_INTENT_SUCCEEDED,
  StripeEventType.PAYMENT_INTENT_PAYMENT_FAILED,
  StripeEventType.PAYMENT_INTENT_CANCELED,
  StripeEventType.CUSTOMER_SUBSCRIPTION_CREATED,
  StripeEventType.CUSTOMER_SUBSCRIPTION_UPDATED,
  StripeEventType.CUSTOMER_SUBSCRIPTION_DELETED,
  StripeEventType.INVOICE_PAYMENT_SUCCEEDED,
  StripeEventType.INVOICE_PAYMENT_FAILED,
  StripeEventType.CHARGE_SUCCEEDED,
  StripeEventType.CHARGE_FAILED,
  StripeEventType.CHARGE_REFUNDED,
  StripeEventType.CUSTOMER_CREATED,
  StripeEventType.CUSTOMER_DELETED,
];

// Webhook signature verification settings
export const WEBHOOK_CONFIG = {
  // Timestamp tolerance in seconds (5 minutes)
  TIMESTAMP_TOLERANCE: 5 * 60,

  // Maximum webhook processing time (30 seconds)
  MAX_PROCESSING_TIME: 30 * 1000,

  // Retry policy
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // ms
  MAX_RETRY_DELAY: 30000, // ms

  // Deduplication
  DEDUP_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
};

// Minimum payment amounts (in cents)
export const MIN_PAYMENT_AMOUNT = {
  [Currency.USD]: 100, // $1.00
  [Currency.EUR]: 100, // €1.00
  [Currency.GBP]: 100, // £1.00
  [Currency.LRD]: 10000, // LRD 100
};

// Maximum payment amounts (in cents)
export const MAX_PAYMENT_AMOUNT = {
  [Currency.USD]: 99999900, // $999,999.00
  [Currency.EUR]: 99999900, // €999,999.00
  [Currency.GBP]: 99999900, // £999,999.00
  [Currency.LRD]: 9999990000, // LRD 99,999,900
};

// Payment fee percentages
export const PAYMENT_FEES = {
  STRIPE_PERCENTAGE: 0.029, // 2.9%
  STRIPE_FIXED: 30, // $0.30 per transaction
  PLATFORM_PERCENTAGE: 0.01, // 1% platform fee
};

// Subscription retention strategies
export const SUBSCRIPTION_RETRY_POLICY = {
  // Days to retry failed payment
  DAYS_UNTIL_CANCEL: 7,
  // Number of retry attempts
  MAX_RETRIES: 3,
  // Email reminders
  REMINDER_DAYS: [1, 3, 5],
};

// Error codes
export enum PaymentErrorCode {
  // Validation errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  MISSING_PAYMENT_METHOD = 'MISSING_PAYMENT_METHOD',

  // Stripe errors
  STRIPE_API_ERROR = 'STRIPE_API_ERROR',
  STRIPE_CONNECTION_ERROR = 'STRIPE_CONNECTION_ERROR',
  STRIPE_RATE_LIMIT = 'STRIPE_RATE_LIMIT',

  // Payment processing errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',

  // Webhook errors
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  WEBHOOK_PROCESSING_ERROR = 'WEBHOOK_PROCESSING_ERROR',
  WEBHOOK_DUPLICATE_EVENT = 'WEBHOOK_DUPLICATE_EVENT',

  // Subscription errors
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_ALREADY_ACTIVE = 'SUBSCRIPTION_ALREADY_ACTIVE',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',

  // Database errors
  PAYMENT_ALREADY_EXISTS = 'PAYMENT_ALREADY_EXISTS',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',

  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

// Log levels for payment operations
export enum PaymentLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}
