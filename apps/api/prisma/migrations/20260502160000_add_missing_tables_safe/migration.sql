-- Safe idempotent migration: create tables from platform_v2_governance that
-- may not have been applied to the production database.

CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supporter',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_key" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Membership_role_joinedAt_idx" ON "Membership"("role", "joinedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Membership_userId_fkey'
  ) THEN
    ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PetitionStatusLog" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetitionStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PetitionStatusLog_petitionId_createdAt_idx" ON "PetitionStatusLog"("petitionId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PetitionStatusLog_petitionId_fkey'
  ) THEN
    ALTER TABLE "PetitionStatusLog" ADD CONSTRAINT "PetitionStatusLog_petitionId_fkey"
      FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
