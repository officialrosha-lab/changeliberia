/*
  Warnings:

  - A unique constraint covering the columns `[momoExternalId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[momoTransactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[momoPreapprovalId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MOBILE_MONEY';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "momoAuthCode" TEXT,
ADD COLUMN     "momoErrorMessage" TEXT,
ADD COLUMN     "momoExternalId" TEXT,
ADD COLUMN     "momoMetadata" TEXT,
ADD COLUMN     "momoPhoneNumber" TEXT,
ADD COLUMN     "momoStatus" TEXT,
ADD COLUMN     "momoTransactionId" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "momoPhoneNumber" TEXT,
ADD COLUMN     "momoPreapprovalId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARD';

-- CreateTable
CREATE TABLE "MoMoSubscriptionAuthorization" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "preapprovalId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "validityTimeInSeconds" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoMoSubscriptionAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MoMoSubscriptionAuthorization_subscriptionId_key" ON "MoMoSubscriptionAuthorization"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "MoMoSubscriptionAuthorization_preapprovalId_key" ON "MoMoSubscriptionAuthorization"("preapprovalId");

-- CreateIndex
CREATE INDEX "MoMoSubscriptionAuthorization_preapprovalId_idx" ON "MoMoSubscriptionAuthorization"("preapprovalId");

-- CreateIndex
CREATE INDEX "MoMoSubscriptionAuthorization_status_expiresAt_idx" ON "MoMoSubscriptionAuthorization"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_momoExternalId_key" ON "Payment"("momoExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_momoTransactionId_key" ON "Payment"("momoTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_momoPreapprovalId_key" ON "Subscription"("momoPreapprovalId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoMoSubscriptionAuthorization" ADD CONSTRAINT "MoMoSubscriptionAuthorization_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
