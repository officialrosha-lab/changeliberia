/**
 * Stripe Configuration
 * Centralized configuration for all Stripe-related settings
 */

export const stripeConfig = {
  // API Configuration
  apiVersion: '2024-11-20' as const,
  
  // Currency and Amount Settings
  currency: (process.env.STRIPE_CURRENCY || 'USD').toLowerCase(),
  
  // Webhook Configuration
  webhook: {
    // Timestamp tolerance in seconds (default: 5 minutes)
    signatureTolerance: parseInt(
      process.env.WEBHOOK_SIGNATURE_TOLERANCE || '300',
      10,
    ),
    // Enable webhook logging/debugging
    enableLogging: process.env.ENABLE_WEBHOOK_LOGGING === 'true',
  },

  // Payment Intent Settings
  paymentIntent: {
    // Payment methods to accept
    paymentMethodTypes: ['card'] as const,
    // Capture payment immediately after authorization
    captureMethod: 'automatic' as const,
  },

  // Subscription Settings
  subscription: {
    // Default subscription intervals
    allowedIntervals: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    // Billing cycle anchor (day of month)
    billingCycleAnchor: 1,
  },

  // Retry Policy
  retry: {
    // Maximum number of retry attempts for failed webhooks
    maxRetries: 3,
    // Initial retry delay in milliseconds
    initialDelay: 1000,
    // Maximum retry delay in milliseconds
    maxDelay: 30000,
  },

  // Environment Detection
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Feature Flags
  features: {
    // Enable Stripe webhooks
    webhooksEnabled: !!process.env.STRIPE_WEBHOOK_SECRET,
    // Enable subscription feature
    subscriptionsEnabled: true,
    // Enable refund feature
    refundsEnabled: true,
    // Enable payment history tracking
    paymentHistoryEnabled: true,
  },

  // Validation Rules
  validation: {
    // Minimum payment amount in USD cents ($1.00)
    minAmountCents: 100,
    // Maximum payment amount in USD cents ($999,999.00)
    maxAmountCents: 99999900,
    // Maximum length for description field
    maxDescriptionLength: 1000,
    // Maximum number of metadata entries
    maxMetadataEntries: 50,
  },

  // Error Handling
  errors: {
    // Timeout for Stripe API calls (milliseconds)
    apiTimeout: 30000,
    // Enable detailed error messages in development
    verboseErrors: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
  },
};

/**
 * Validate Stripe configuration
 * Throws error if required configuration is missing
 */
export function validateStripeConfig(): void {
  const apiKey = process.env.STRIPE_API_KEY;
  
  if (!apiKey) {
    throw new Error('STRIPE_API_KEY environment variable is required');
  }

  if (stripeConfig.isProduction) {
    if (!apiKey.startsWith('sk_live_')) {
      throw new Error(
        'Production environment requires STRIPE_API_KEY to use live key (sk_live_*)',
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Production environment requires STRIPE_WEBHOOK_SECRET');
    }

    if (!webhookSecret.startsWith('whsec_')) {
      throw new Error('STRIPE_WEBHOOK_SECRET should be in format whsec_*');
    }
  } else if (stripeConfig.isDevelopment) {
    if (!apiKey.startsWith('sk_test_')) {
      console.warn(
        'Development environment should use test key (sk_test_*) for STRIPE_API_KEY',
      );
    }
  }
}

/**
 * Get API version for Stripe client
 */
export function getStripeApiVersion() {
  return stripeConfig.apiVersion;
}

/**
 * Get webhook signature tolerance in seconds
 */
export function getWebhookSignatureTolerance(): number {
  return stripeConfig.webhook.signatureTolerance;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof stripeConfig.features): boolean {
  return stripeConfig.features[feature];
}
