-- AlterTable
ALTER TABLE "Supporter"
ADD COLUMN "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "unsubscribeToken" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Supporter_unsubscribeToken_key" UNIQUE ("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Supporter_email_idx" ON "Supporter"("email");
