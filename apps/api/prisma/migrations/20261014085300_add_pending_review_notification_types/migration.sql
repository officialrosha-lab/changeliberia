-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'PETITION_PENDING_REVIEW';
ALTER TYPE "EmailType" ADD VALUE 'POLL_PENDING_REVIEW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PETITION_PENDING_REVIEW';
ALTER TYPE "NotificationType" ADD VALUE 'POLL_PENDING_REVIEW';

-- AlterTable
ALTER TABLE "Supporter" ALTER COLUMN "unsubscribeToken" DROP DEFAULT;
