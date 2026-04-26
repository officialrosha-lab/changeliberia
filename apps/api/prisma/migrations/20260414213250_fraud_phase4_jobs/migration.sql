-- CreateEnum
CREATE TYPE "FraudJobType" AS ENUM ('ANOMALY_SCAN');

-- CreateEnum
CREATE TYPE "FraudJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "FraudJob" (
    "id" TEXT NOT NULL,
    "type" "FraudJobType" NOT NULL,
    "status" "FraudJobStatus" NOT NULL DEFAULT 'QUEUED',
    "payload" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FraudJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FraudJob_status_createdAt_idx" ON "FraudJob"("status", "createdAt");
