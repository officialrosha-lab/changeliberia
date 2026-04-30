-- Idempotent: add petitionType column if it does not already exist.
-- The earlier migration (20260430131934) may not have applied on the
-- production database, so this ensures the column is present.
ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "petitionType" TEXT;
