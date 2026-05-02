-- Safe idempotent migration: add columns that were part of platform_v2_governance
-- but may not have been applied to the production database.

DO $$
BEGIN
  -- Petition columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='categories') THEN
    ALTER TABLE "Petition" ADD COLUMN "categories" TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='county') THEN
    ALTER TABLE "Petition" ADD COLUMN "county" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='displayName') THEN
    ALTER TABLE "Petition" ADD COLUMN "displayName" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='isAnonymous') THEN
    ALTER TABLE "Petition" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='priorActions') THEN
    ALTER TABLE "Petition" ADD COLUMN "priorActions" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Petition' AND column_name='tags') THEN
    ALTER TABLE "Petition" ADD COLUMN "tags" TEXT[];
  END IF;

  -- User columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='address') THEN
    ALTER TABLE "User" ADD COLUMN "address" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='age') THEN
    ALTER TABLE "User" ADD COLUMN "age" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='county') THEN
    ALTER TABLE "User" ADD COLUMN "county" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='gender') THEN
    ALTER TABLE "User" ADD COLUMN "gender" TEXT;
  END IF;
END $$;
