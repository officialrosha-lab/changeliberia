-- CreateEnum
CREATE TYPE "OfficialStaffRole" AS ENUM ('CHIEF_OF_STAFF', 'LEGISLATIVE_ASSISTANT', 'COMMUNICATIONS_OFFICER', 'POLICY_ADVISOR', 'RESEARCH_OFFICER', 'CASE_MANAGER');

-- CreateEnum
CREATE TYPE "OfficialStaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "EndorserType" AS ENUM ('TRADITIONAL_LEADER', 'RELIGIOUS_LEADER', 'CIVIC_LEADER', 'BUSINESS_LEADER', 'OTHER');

-- CreateEnum
CREATE TYPE "EndorsementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OfficialStaffMember" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OfficialStaffRole" NOT NULL,
    "status" "OfficialStaffStatus" NOT NULL DEFAULT 'INVITED',
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDraft" BOOLEAN NOT NULL DEFAULT false,
    "canRespond" BOOLEAN NOT NULL DEFAULT false,
    "canManageInbox" BOOLEAN NOT NULL DEFAULT false,
    "canGenerateReports" BOOLEAN NOT NULL DEFAULT false,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "OfficialStaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetitionEndorsement" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "userId" TEXT,
    "endorserName" TEXT NOT NULL,
    "endorserTitle" TEXT,
    "endorserType" "EndorserType" NOT NULL,
    "organization" TEXT,
    "statement" TEXT,
    "status" "EndorsementStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetitionEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficialStaffMember_institutionId_status_idx" ON "OfficialStaffMember"("institutionId", "status");

-- CreateIndex
CREATE INDEX "OfficialStaffMember_userId_idx" ON "OfficialStaffMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialStaffMember_institutionId_userId_key" ON "OfficialStaffMember"("institutionId", "userId");

-- CreateIndex
CREATE INDEX "PetitionEndorsement_petitionId_status_idx" ON "PetitionEndorsement"("petitionId", "status");

-- CreateIndex
CREATE INDEX "PetitionEndorsement_status_createdAt_idx" ON "PetitionEndorsement"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OfficialStaffMember" ADD CONSTRAINT "OfficialStaffMember_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialStaffMember" ADD CONSTRAINT "OfficialStaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionEndorsement" ADD CONSTRAINT "PetitionEndorsement_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionEndorsement" ADD CONSTRAINT "PetitionEndorsement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
