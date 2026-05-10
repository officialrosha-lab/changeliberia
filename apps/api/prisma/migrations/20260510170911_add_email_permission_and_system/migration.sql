-- AlterEnum
ALTER TYPE "PermissionResource" ADD VALUE 'EMAIL';

-- AlterTable
ALTER TABLE "NotificationPreference" ALTER COLUMN "unsubscribeToken" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
