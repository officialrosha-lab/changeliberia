-- One-off repair: production's migration history recorded
-- 20261001161943_add_email_verification_attempts as applied without the
-- underlying ALTER TABLE ever landing (classic migration-history drift).
-- Idempotent — safe to run more than once.
ALTER TABLE "EmailVerificationToken" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
