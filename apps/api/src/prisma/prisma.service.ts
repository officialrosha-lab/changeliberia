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
    ];
    for (const { sql, label } of safeTables) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Could not ensure ${label} table:`, err);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
