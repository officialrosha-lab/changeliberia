-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED', 'FRAUD_BLOCKED');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('SIGNATURES', 'TRENDING', 'GOVERNMENT_READY');

-- AlterTable
ALTER TABLE "DonationConfig" ALTER COLUMN "supportedCurrencies" SET DEFAULT '["USD", "LRD"]';

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeEmail" TEXT,
    "refereePhone" TEXT,
    "referralCode" TEXT NOT NULL,
    "shareUrl" TEXT NOT NULL,
    "whatsappMessage" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "convertedSignatureId" TEXT,
    "trustBonusApplied" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "conversionDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetitionMilestone" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),
    "shareTriggered" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetitionMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "referralId" TEXT,
    "shortCode" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "medium" TEXT NOT NULL DEFAULT 'organic',
    "campaign" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastClickedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_petitionId_referrerId_idx" ON "Referral"("petitionId", "referrerId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PetitionMilestone_petitionId_achieved_idx" ON "PetitionMilestone"("petitionId", "achieved");

-- CreateIndex
CREATE INDEX "PetitionMilestone_achievedAt_idx" ON "PetitionMilestone"("achievedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetitionMilestone_petitionId_type_targetValue_key" ON "PetitionMilestone"("petitionId", "type", "targetValue");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_shortCode_key" ON "ShareLink"("shortCode");

-- CreateIndex
CREATE INDEX "ShareLink_petitionId_source_idx" ON "ShareLink"("petitionId", "source");

-- CreateIndex
CREATE INDEX "ShareLink_clickCount_conversions_idx" ON "ShareLink"("clickCount", "conversions");

-- CreateIndex
CREATE INDEX "ShareLink_createdAt_idx" ON "ShareLink"("createdAt");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionMilestone" ADD CONSTRAINT "PetitionMilestone_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ContentRelation_sourceContentId_targetContentId_relationType_ke" RENAME TO "ContentRelation_sourceContentId_targetContentId_relationTyp_key";
