import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Petitions Scheduler
 * Handles daily maintenance tasks for petitions
 */
@Injectable()
export class PetitionsScheduler {
  private readonly logger = new Logger(PetitionsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reset daily signatures counter at midnight UTC
   * This allows the trending algorithm to properly identify
   * petitions gaining momentum today vs. all-time signatures
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailySignatures() {
    try {
      const result = await this.prisma.petition.updateMany({
        data: { todaySignatures: 0 },
      });
      this.logger.log(
        `✅ Reset todaySignatures for ${result.count} petitions`,
      );
    } catch (error) {
      this.logger.error('Failed to reset daily signatures:', error);
      throw error;
    }
  }
}
