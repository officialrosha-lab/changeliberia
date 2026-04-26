/*
  Warnings:

  - A unique constraint covering the columns `[stripeChargeId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeInvoiceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "lastWebhookEventId" TEXT,
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "lastWebhookEventId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "WebhookEventLog" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "paymentId" TEXT,
    "subscriptionId" TEXT,
    "payload" TEXT NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEventLog_stripeEventId_key" ON "WebhookEventLog"("stripeEventId");

-- CreateIndex
CREATE INDEX "WebhookEventLog_stripeEventId_idx" ON "WebhookEventLog"("stripeEventId");

-- CreateIndex
CREATE INDEX "WebhookEventLog_eventType_createdAt_idx" ON "WebhookEventLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEventLog_status_createdAt_idx" ON "WebhookEventLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEventLog_paymentId_createdAt_idx" ON "WebhookEventLog"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEventLog_subscriptionId_createdAt_idx" ON "WebhookEventLog"("subscriptionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_stripeChargeId_idx" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Payment_stripeInvoiceId_idx" ON "Payment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_lastWebhookEventId_idx" ON "Payment"("lastWebhookEventId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_lastWebhookEventId_idx" ON "Subscription"("lastWebhookEventId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "WebhookEventLog" ADD CONSTRAINT "WebhookEventLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEventLog" ADD CONSTRAINT "WebhookEventLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
