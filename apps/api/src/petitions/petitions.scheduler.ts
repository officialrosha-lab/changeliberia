import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Petitions Scheduler — daily maintenance tasks for petitions.
 * Invoked daily at midnight UTC by Vercel Cron via CronController — see apps/api/src/cron.
 */
@Injectable()
export class PetitionsScheduler {
  private readonly logger = new Logger(PetitionsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reset daily signatures counter — lets the trending algorithm identify
   * petitions gaining momentum today vs. all-time signatures.
   */
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
