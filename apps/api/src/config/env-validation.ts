/**
 * Fail fast in production when critical secrets are missing or unsafe.
 */
export function validateEnvOrThrow(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const jwt = process.env.JWT_SECRET ?? '';
  if (!jwt || jwt === 'super-secret') {
    throw new Error(
      'Production requires JWT_SECRET to be set to a strong, unique value (not the dev default).',
    );
  }

  const db = process.env.DATABASE_URL ?? '';
  if (!db.trim()) {
    throw new Error('Production requires DATABASE_URL.');
  }

  // Stripe validation is skipped when SKIP_STRIPE_VALIDATION=true (e.g. staging without live keys)
  if (process.env.SKIP_STRIPE_VALIDATION !== 'true') {
    const stripeApiKey = process.env.STRIPE_API_KEY ?? '';
    if (!stripeApiKey.trim()) {
      throw new Error('Production requires STRIPE_API_KEY to be set.');
    }

    if (!stripeApiKey.startsWith('sk_live_')) {
      throw new Error(
        'Production requires STRIPE_API_KEY to use live key (sk_live_*), not test key.',
      );
    }

    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!stripeWebhookSecret.trim()) {
      throw new Error('Production requires STRIPE_WEBHOOK_SECRET to be set.');
    }

    if (!stripeWebhookSecret.startsWith('whsec_')) {
      throw new Error(
        'Production requires STRIPE_WEBHOOK_SECRET to be in correct format (whsec_*).',
      );
    }
  }
}

/**
 * Validate email system environment variables in production
 */
export function validateEmailEnvOrThrow(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const resendApiKey = process.env.RESEND_API_KEY ?? '';
  if (!resendApiKey.trim()) {
    throw new Error('Production requires RESEND_API_KEY to be set.');
  }

  if (!resendApiKey.startsWith('re_')) {
    throw new Error('Production requires RESEND_API_KEY in format re_*');
  }

  const redisUrl = process.env.REDIS_URL ?? '';
  if (!redisUrl.trim()) {
    throw new Error('Production requires REDIS_URL to be set.');
  }

  const mailFrom = process.env.MAIL_FROM ?? '';
  if (!mailFrom.trim()) {
    throw new Error('Production requires MAIL_FROM to be set.');
  }
}
