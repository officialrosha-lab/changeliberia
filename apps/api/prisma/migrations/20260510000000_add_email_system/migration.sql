-- AlterEnum for EmailType
CREATE TYPE "EmailType" AS ENUM (
  'WELCOME',
  'VERIFY_EMAIL',
  'PASSWORD_RESET',
  'PASSWORD_RESET_CONFIRMATION',
  'PETITION_APPROVED',
  'PETITION_REJECTED',
  'PETITION_MILESTONE_REACHED',
  'GOVERNMENT_SUBMISSION',
  'OFFICIAL_RESPONSE',
  'WELCOME_TO_MOVEMENT',
  'WEEKLY_DIGEST',
  'AMBASSADOR_UPDATE',
  'DONATION_RECEIVED',
  'COMMENT_REPLY',
  'SIGNATURE_RECEIVED'
);

-- AlterEnum for EmailStatus
CREATE TYPE "EmailStatus" AS ENUM (
  'QUEUED',
  'SENT',
  'DELIVERED',
  'BOUNCED',
  'FAILED',
  'OPENED'
);

-- Add columns to NotificationPreference
ALTER TABLE "NotificationPreference" ADD COLUMN "emailCategories" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN "preferredSendTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN "unsubscribeToken" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "NotificationPreference_unsubscribeToken_key" UNIQUE ("unsubscribeToken");

-- CreateTable EmailLog
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipient" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "resendMessageId" TEXT,
    "trackingPixelId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_userId_createdAt_idx" ON "EmailLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_recipient_status_idx" ON "EmailLog"("recipient", "status");

-- CreateIndex
CREATE INDEX "EmailLog_type_status_idx" ON "EmailLog"("type", "status");

-- CreateIndex
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_trackingPixelId_idx" ON "EmailLog"("trackingPixelId");

-- CreateIndex
CREATE INDEX "EmailLog_resendMessageId_idx" ON "EmailLog"("resendMessageId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
