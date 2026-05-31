/*
  Warnings:

  - The `status` column on the `Poll` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'CLOSED');

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "status",
ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Poll_status_idx" ON "Poll"("status");
