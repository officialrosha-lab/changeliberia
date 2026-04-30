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
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
