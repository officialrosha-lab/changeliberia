import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Ensure columns added by migrations that may not have run on the
    // production database are present. Using IF NOT EXISTS makes this safe
    // to run on every startup regardless of migration state.
    try {
      await this.$executeRawUnsafe(
        `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "petitionType" TEXT`,
      );
    } catch (err) {
      this.logger.warn('Could not ensure petitionType column:', err);
    }
    // Nullable columns added to existing tables
    const safeAlters = [
      `ALTER TABLE "Supporter" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "priorActions" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "displayName" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "county" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "age" INTEGER`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "county" TEXT`,
    ];
    for (const sql of safeAlters) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Column guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    // Public Officials Portal: enum values must exist before columns using them
    const safeEnumValues = [
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'SENATOR'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'REPRESENTATIVE'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'MAYOR'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'SUPERINTENDENT'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'COMMISSIONER'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'DISTRICT_COMMISSIONER'`,
      `ALTER TYPE "InstitutionCategory" ADD VALUE IF NOT EXISTS 'EXECUTIVE_OFFICE'`,
      `ALTER TYPE "PermissionResource" ADD VALUE IF NOT EXISTS 'OFFICIAL'`,
      `ALTER TYPE "PermissionResource" ADD VALUE IF NOT EXISTS 'INBOX'`,
      `ALTER TYPE "PermissionResource" ADD VALUE IF NOT EXISTS 'RESPONSE'`,
      `ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'OFFICIAL_VERIFIED'`,
      `ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'OFFICIAL_REJECTED'`,
    ];
    for (const sql of safeEnumValues) {
      try {
        // ALTER TYPE ... ADD VALUE cannot run inside a transaction block in
        // older Postgres, and $executeRawUnsafe already runs unbatched.
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Enum value guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    const safeOfficialAlters = [
      `DO $$ BEGIN
        CREATE TYPE "OfficialVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "GovernmentResponseStage" AS ENUM ('RECEIVED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATION', 'ACTION_PLANNED', 'IMPLEMENTATION', 'RESOLVED', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "county" TEXT`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "district" TEXT`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "termStartDate" TIMESTAMP(3)`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "termEndDate" TIMESTAMP(3)`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "politicalParty" TEXT`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "holderUserId" TEXT`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "officialStatus" "OfficialVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED'`,
      `ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Institution_holderUserId_key" ON "Institution"("holderUserId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Institution_slug_key" ON "Institution"("slug")`,
      `CREATE INDEX IF NOT EXISTS "Institution_category_county_district_idx" ON "Institution"("category", "county", "district")`,
      `CREATE INDEX IF NOT EXISTS "Institution_officialStatus_idx" ON "Institution"("officialStatus")`,
    ];
    for (const sql of safeOfficialAlters) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Official-portal column guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    // Petition Location Verification & Impact Area System (Phase 1)
    const safeImpactAreaAlters = [
      `DO $$ BEGIN
        CREATE TYPE "ImpactScope" AS ENUM ('COMMUNITY', 'DISTRICT', 'COUNTY', 'MULTI_COUNTY', 'NATIONAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "RelationshipType" AS ENUM ('LIVES_HERE', 'WORKS_HERE', 'ATTENDS_SCHOOL_HERE', 'OWNS_PROPERTY_HERE', 'BUSINESS_OPERATES_HERE', 'FREQUENTLY_USES_AREA', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "SignatureClassification" AS ENUM ('DIRECTLY_AFFECTED', 'NEARBY_COMMUNITY', 'SUPPORTER', 'DIASPORA_SUPPORTER', 'UNKNOWN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "district" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "community" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "landmark" TEXT`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "impactScope" "ImpactScope"`,
      `ALTER TABLE "Petition" ADD COLUMN IF NOT EXISTS "counties" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "district" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "community" TEXT`,
      `CREATE INDEX IF NOT EXISTS "Petition_impactScope_county_district_idx" ON "Petition"("impactScope", "county", "district")`,
    ];
    for (const sql of safeImpactAreaAlters) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Impact-area column guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    // Petition Location Verification & Impact Area System (Phase 2) — polls
    const safePollImpactAreaAlters = [
      `ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "district" TEXT`,
      `ALTER TABLE "Poll" ADD COLUMN IF NOT EXISTS "community" TEXT`,
      `ALTER TABLE "PollVote" ADD COLUMN IF NOT EXISTS "county" TEXT`,
      `ALTER TABLE "PollVote" ADD COLUMN IF NOT EXISTS "district" TEXT`,
      `ALTER TABLE "PollVote" ADD COLUMN IF NOT EXISTS "community" TEXT`,
    ];
    for (const sql of safePollImpactAreaAlters) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Poll impact-area column guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    // Public Officials Portal (leftover work): delegated staff + endorsements
    const safeStaffAndEndorsementEnums = [
      `DO $$ BEGIN
        CREATE TYPE "OfficialStaffRole" AS ENUM ('CHIEF_OF_STAFF', 'LEGISLATIVE_ASSISTANT', 'COMMUNICATIONS_OFFICER', 'POLICY_ADVISOR', 'RESEARCH_OFFICER', 'CASE_MANAGER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "OfficialStaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "EndorserType" AS ENUM ('TRADITIONAL_LEADER', 'RELIGIOUS_LEADER', 'CIVIC_LEADER', 'BUSINESS_LEADER', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "EndorsementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    ];
    for (const sql of safeStaffAndEndorsementEnums) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Staff/endorsement enum guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }

    const safeTables: { sql: string; label: string }[] = [
      {
        label: 'Sponsor',
        sql: `CREATE TABLE IF NOT EXISTS "Sponsor" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "logoUrl" TEXT NOT NULL,
          "websiteUrl" TEXT,
          "type" TEXT NOT NULL DEFAULT 'sponsor',
          "displayOrder" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
        )`,
      },
      {
        label: 'Membership',
        sql: `CREATE TABLE IF NOT EXISTS "Membership" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'supporter',
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Membership_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Membership_userId_key" UNIQUE ("userId")
        )`,
      },
      {
        label: 'Supporter',
        sql: `CREATE TABLE IF NOT EXISTS "Supporter" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "userId" TEXT,
          "email" TEXT,
          "phone" TEXT,
          "source" TEXT NOT NULL DEFAULT 'navbar',
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Supporter_sessionId_key" UNIQUE ("sessionId")
        )`,
      },
      {
        label: 'PetitionStatusLog',
        sql: `CREATE TABLE IF NOT EXISTS "PetitionStatusLog" (
          "id" TEXT NOT NULL,
          "petitionId" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PetitionStatusLog_pkey" PRIMARY KEY ("id")
        )`,
      },
      {
        label: 'InstitutionOfficialProfile',
        sql: `CREATE TABLE IF NOT EXISTS "InstitutionOfficialProfile" (
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "InstitutionOfficialProfile_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "InstitutionOfficialProfile_institutionId_key" UNIQUE ("institutionId")
        )`,
      },
      {
        label: 'InstitutionStatusLog',
        sql: `CREATE TABLE IF NOT EXISTS "InstitutionStatusLog" (
          "id" TEXT NOT NULL,
          "institutionId" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "note" TEXT,
          "actorUserId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "InstitutionStatusLog_pkey" PRIMARY KEY ("id")
        )`,
      },
      {
        label: 'PetitionGovernmentResponse',
        sql: `CREATE TABLE IF NOT EXISTS "PetitionGovernmentResponse" (
          "id" TEXT NOT NULL,
          "petitionId" TEXT NOT NULL,
          "institutionId" TEXT NOT NULL,
          "currentStage" TEXT NOT NULL DEFAULT 'RECEIVED',
          "assignedToUserId" TEXT,
          "publicSummary" TEXT,
          "internalNotes" TEXT,
          "targetResolutionDate" TIMESTAMP(3),
          "resolvedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PetitionGovernmentResponse_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PetitionGovernmentResponse_petitionId_institutionId_key" UNIQUE ("petitionId", "institutionId")
        )`,
      },
      {
        label: 'GovernmentResponseTimelineEntry',
        sql: `CREATE TABLE IF NOT EXISTS "GovernmentResponseTimelineEntry" (
          "id" TEXT NOT NULL,
          "responseId" TEXT NOT NULL,
          "stage" TEXT NOT NULL,
          "note" TEXT,
          "actorUserId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GovernmentResponseTimelineEntry_pkey" PRIMARY KEY ("id")
        )`,
      },
      {
        label: 'SignatureLocation',
        sql: `CREATE TABLE IF NOT EXISTS "SignatureLocation" (
          "id" TEXT NOT NULL,
          "signatureId" TEXT NOT NULL,
          "personallyAffected" BOOLEAN,
          "relationshipType" "RelationshipType",
          "county" TEXT,
          "district" TEXT,
          "community" TEXT,
          "locationSource" TEXT NOT NULL DEFAULT 'unconfirmed',
          "classification" "SignatureClassification" NOT NULL DEFAULT 'UNKNOWN',
          "confidenceScore" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SignatureLocation_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "SignatureLocation_signatureId_key" UNIQUE ("signatureId")
        )`,
      },
      {
        label: 'OfficialStaffMember',
        sql: `CREATE TABLE IF NOT EXISTS "OfficialStaffMember" (
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
          CONSTRAINT "OfficialStaffMember_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "OfficialStaffMember_institutionId_userId_key" UNIQUE ("institutionId", "userId")
        )`,
      },
      {
        label: 'PetitionEndorsement',
        sql: `CREATE TABLE IF NOT EXISTS "PetitionEndorsement" (
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PetitionEndorsement_pkey" PRIMARY KEY ("id")
        )`,
      },
      {
        label: 'PushSubscription',
        sql: `CREATE TABLE IF NOT EXISTS "PushSubscription" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "endpoint" TEXT NOT NULL,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
        )`,
      },
    ];
    for (const { sql, label } of safeTables) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Could not ensure ${label} table:`, err);
      }
    }

    // Indexes that depend on tables created above
    const safePostTableIndexes = [
      `CREATE INDEX IF NOT EXISTS "SignatureLocation_signatureId_idx" ON "SignatureLocation"("signatureId")`,
      `CREATE INDEX IF NOT EXISTS "SignatureLocation_classification_idx" ON "SignatureLocation"("classification")`,
      `CREATE INDEX IF NOT EXISTS "OfficialStaffMember_institutionId_status_idx" ON "OfficialStaffMember"("institutionId", "status")`,
      `CREATE INDEX IF NOT EXISTS "OfficialStaffMember_userId_idx" ON "OfficialStaffMember"("userId")`,
      `CREATE INDEX IF NOT EXISTS "PetitionEndorsement_petitionId_status_idx" ON "PetitionEndorsement"("petitionId", "status")`,
      `CREATE INDEX IF NOT EXISTS "PetitionEndorsement_status_createdAt_idx" ON "PetitionEndorsement"("status", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId")`,
    ];
    for (const sql of safePostTableIndexes) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Index guard skipped: ${sql.slice(0, 60)}`, err);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
