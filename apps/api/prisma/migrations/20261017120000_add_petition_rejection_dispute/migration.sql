-- AlterTable
ALTER TABLE "Petition" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "disputeMessage" TEXT,
ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedBy" TEXT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DomainEventType" ADD VALUE 'PETITION_APPROVED';
ALTER TYPE "DomainEventType" ADD VALUE 'PETITION_REJECTED';
ALTER TYPE "DomainEventType" ADD VALUE 'PETITION_RESUBMITTED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PETITION_RESUBMITTED';
