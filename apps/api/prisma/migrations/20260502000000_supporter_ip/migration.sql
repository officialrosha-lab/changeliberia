-- AlterTable
ALTER TABLE "Supporter" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Supporter_ipAddress_idx" ON "Supporter"("ipAddress");
