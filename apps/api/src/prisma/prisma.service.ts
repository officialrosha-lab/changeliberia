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
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Sponsor" (
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
        )
      `);
    } catch (err) {
      this.logger.warn('Could not ensure Sponsor table:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
