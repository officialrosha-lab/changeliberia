-- CreateEnum
CREATE TYPE "ConstituencyReportPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ConstituencyReportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE 'CONSTITUENCY_REPORT_READY';

-- CreateTable
CREATE TABLE "ConstituencyReportPreference" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "weeklyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "monthlyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quarterlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "annualEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "ConstituencyReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstituencyReport" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "period" "ConstituencyReportPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ConstituencyReportStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstituencyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstituencyReportFile" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstituencyReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstituencyReportDelivery" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "recipientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstituencyReportDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConstituencyReportPreference_institutionId_key" ON "ConstituencyReportPreference"("institutionId");

-- CreateIndex
CREATE INDEX "ConstituencyReport_institutionId_period_periodStart_idx" ON "ConstituencyReport"("institutionId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "ConstituencyReport_status_idx" ON "ConstituencyReport"("status");

-- CreateIndex
CREATE INDEX "ConstituencyReportFile_reportId_idx" ON "ConstituencyReportFile"("reportId");

-- CreateIndex
CREATE INDEX "ConstituencyReportDelivery_reportId_idx" ON "ConstituencyReportDelivery"("reportId");

-- AddForeignKey
ALTER TABLE "ConstituencyReportPreference" ADD CONSTRAINT "ConstituencyReportPreference_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstituencyReport" ADD CONSTRAINT "ConstituencyReport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstituencyReportFile" ADD CONSTRAINT "ConstituencyReportFile_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ConstituencyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstituencyReportDelivery" ADD CONSTRAINT "ConstituencyReportDelivery_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ConstituencyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
