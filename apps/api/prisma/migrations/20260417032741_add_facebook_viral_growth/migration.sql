-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EMAIL_FAILED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('SHARE_WIZARD', 'VIRAL_HERO', 'NETWORK_BUILDER', 'INFLUENCER', 'STREAK_MASTER');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChallengePeriod" AS ENUM ('WEEKLY', 'CAMPAIGN');

-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "facebookEngagementScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "facebookShareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "influencerFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "networkReachEstimate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shareDialogUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viralMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "PetitionSubmission" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "governmentEmail" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "responseNotes" TEXT,
    "pdfUrl" TEXT,
    "signatureCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetitionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialEngagementBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "multiplierBonus" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialEngagementBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareChallenge" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "period" "ChallengePeriod" NOT NULL DEFAULT 'WEEKLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "goalType" TEXT NOT NULL,
    "goalValue" INTEGER NOT NULL,
    "rewardMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "earnedBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacebookPixelEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "petitionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "conversionValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pixelId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookPixelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomAudience" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audienceType" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "userIds" TEXT NOT NULL,
    "estimatedSize" INTEGER NOT NULL DEFAULT 0,
    "facebookAudienceId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAudience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetitionSubmission_petitionId_status_idx" ON "PetitionSubmission"("petitionId", "status");

-- CreateIndex
CREATE INDEX "PetitionSubmission_submittedBy_createdAt_idx" ON "PetitionSubmission"("submittedBy", "createdAt");

-- CreateIndex
CREATE INDEX "PetitionSubmission_status_createdAt_idx" ON "PetitionSubmission"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetitionSubmission_petitionId_submittedAt_key" ON "PetitionSubmission"("petitionId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentContact_email_key" ON "GovernmentContact"("email");

-- CreateIndex
CREATE INDEX "GovernmentContact_category_priority_idx" ON "GovernmentContact"("category", "priority");

-- CreateIndex
CREATE INDEX "GovernmentContact_region_isActive_idx" ON "GovernmentContact"("region", "isActive");

-- CreateIndex
CREATE INDEX "GovernmentContact_isActive_priority_idx" ON "GovernmentContact"("isActive", "priority");

-- CreateIndex
CREATE INDEX "SocialEngagementBadge_userId_badgeType_idx" ON "SocialEngagementBadge"("userId", "badgeType");

-- CreateIndex
CREATE INDEX "SocialEngagementBadge_petitionId_badgeType_idx" ON "SocialEngagementBadge"("petitionId", "badgeType");

-- CreateIndex
CREATE INDEX "SocialEngagementBadge_earnedAt_idx" ON "SocialEngagementBadge"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialEngagementBadge_userId_petitionId_badgeType_key" ON "SocialEngagementBadge"("userId", "petitionId", "badgeType");

-- CreateIndex
CREATE INDEX "ShareChallenge_petitionId_period_startDate_idx" ON "ShareChallenge"("petitionId", "period", "startDate");

-- CreateIndex
CREATE INDEX "ShareChallenge_status_endDate_idx" ON "ShareChallenge"("status", "endDate");

-- CreateIndex
CREATE INDEX "ShareChallenge_createdAt_idx" ON "ShareChallenge"("createdAt");

-- CreateIndex
CREATE INDEX "ChallengeMembership_challengeId_completed_idx" ON "ChallengeMembership"("challengeId", "completed");

-- CreateIndex
CREATE INDEX "ChallengeMembership_userId_completedAt_idx" ON "ChallengeMembership"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMembership_userId_challengeId_key" ON "ChallengeMembership"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "FacebookPixelEvent_eventId_key" ON "FacebookPixelEvent"("eventId");

-- CreateIndex
CREATE INDEX "FacebookPixelEvent_petitionId_eventType_idx" ON "FacebookPixelEvent"("petitionId", "eventType");

-- CreateIndex
CREATE INDEX "FacebookPixelEvent_userId_createdAt_idx" ON "FacebookPixelEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FacebookPixelEvent_eventType_createdAt_idx" ON "FacebookPixelEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "CustomAudience_petitionId_audienceType_idx" ON "CustomAudience"("petitionId", "audienceType");

-- CreateIndex
CREATE INDEX "CustomAudience_syncedAt_idx" ON "CustomAudience"("syncedAt");

-- CreateIndex
CREATE INDEX "ShareLink_influencerFlag_viralMultiplier_idx" ON "ShareLink"("influencerFlag", "viralMultiplier");

-- AddForeignKey
ALTER TABLE "PetitionSubmission" ADD CONSTRAINT "PetitionSubmission_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionSubmission" ADD CONSTRAINT "PetitionSubmission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialEngagementBadge" ADD CONSTRAINT "SocialEngagementBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialEngagementBadge" ADD CONSTRAINT "SocialEngagementBadge_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareChallenge" ADD CONSTRAINT "ShareChallenge_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMembership" ADD CONSTRAINT "ChallengeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMembership" ADD CONSTRAINT "ChallengeMembership_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ShareChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacebookPixelEvent" ADD CONSTRAINT "FacebookPixelEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacebookPixelEvent" ADD CONSTRAINT "FacebookPixelEvent_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomAudience" ADD CONSTRAINT "CustomAudience_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
