-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "lastWebhookEventId" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "providerPaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_providerPaymentIntentId_key" ON "Invoice"("providerPaymentIntentId");

