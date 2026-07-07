/*
  Warnings:

  - A unique constraint covering the columns `[holderUserId]` on the table `Institution` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Institution` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OfficialVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "GovernmentResponseStage" AS ENUM ('RECEIVED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATION', 'ACTION_PLANNED', 'IMPLEMENTATION', 'RESOLVED', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'OFFICIAL_VERIFIED';
ALTER TYPE "EmailType" ADD VALUE 'OFFICIAL_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InstitutionCategory" ADD VALUE 'SENATOR';
ALTER TYPE "InstitutionCategory" ADD VALUE 'REPRESENTATIVE';
ALTER TYPE "InstitutionCategory" ADD VALUE 'MAYOR';
ALTER TYPE "InstitutionCategory" ADD VALUE 'SUPERINTENDENT';
ALTER TYPE "InstitutionCategory" ADD VALUE 'COMMISSIONER';
ALTER TYPE "InstitutionCategory" ADD VALUE 'DISTRICT_COMMISSIONER';
ALTER TYPE "InstitutionCategory" ADD VALUE 'EXECUTIVE_OFFICE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PermissionResource" ADD VALUE 'OFFICIAL';
ALTER TYPE "PermissionResource" ADD VALUE 'INBOX';
ALTER TYPE "PermissionResource" ADD VALUE 'RESPONSE';

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "county" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "holderUserId" TEXT,
ADD COLUMN     "officialStatus" "OfficialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "politicalParty" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "termEndDate" TIMESTAMP(3),
ADD COLUMN     "termStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "_ContentToContentTag" ADD CONSTRAINT "_ContentToContentTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ContentToContentTag_AB_unique";

-- CreateTable
CREATE TABLE "InstitutionOfficialProfile" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "officeHours" TEXT,
    "officeAddress" TEXT,
    "socialLinks" TEXT NOT NULL DEFAULT '[]',
    "verificationDocUrl" TEXT,
    "verificationDocType" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionOfficialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionStatusLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "status" "OfficialVerificationStatus" NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetitionGovernmentResponse" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "currentStage" "GovernmentResponseStage" NOT NULL DEFAULT 'RECEIVED',
    "assignedToUserId" TEXT,
    "publicSummary" TEXT,
    "internalNotes" TEXT,
    "targetResolutionDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetitionGovernmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentResponseTimelineEntry" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "stage" "GovernmentResponseStage" NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentResponseTimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionOfficialProfile_institutionId_key" ON "InstitutionOfficialProfile"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionOfficialProfile_institutionId_idx" ON "InstitutionOfficialProfile"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionStatusLog_institutionId_createdAt_idx" ON "InstitutionStatusLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "PetitionGovernmentResponse_institutionId_currentStage_idx" ON "PetitionGovernmentResponse"("institutionId", "currentStage");

-- CreateIndex
CREATE INDEX "PetitionGovernmentResponse_petitionId_idx" ON "PetitionGovernmentResponse"("petitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PetitionGovernmentResponse_petitionId_institutionId_key" ON "PetitionGovernmentResponse"("petitionId", "institutionId");

-- CreateIndex
CREATE INDEX "GovernmentResponseTimelineEntry_responseId_createdAt_idx" ON "GovernmentResponseTimelineEntry"("responseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_holderUserId_key" ON "Institution"("holderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE INDEX "Institution_category_county_district_idx" ON "Institution"("category", "county", "district");

-- CreateIndex
CREATE INDEX "Institution_officialStatus_idx" ON "Institution"("officialStatus");

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_holderUserId_fkey" FOREIGN KEY ("holderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionOfficialProfile" ADD CONSTRAINT "InstitutionOfficialProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionStatusLog" ADD CONSTRAINT "InstitutionStatusLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionGovernmentResponse" ADD CONSTRAINT "PetitionGovernmentResponse_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionGovernmentResponse" ADD CONSTRAINT "PetitionGovernmentResponse_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentResponseTimelineEntry" ADD CONSTRAINT "GovernmentResponseTimelineEntry_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "PetitionGovernmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
