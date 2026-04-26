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

  // Validate Stripe configuration
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
