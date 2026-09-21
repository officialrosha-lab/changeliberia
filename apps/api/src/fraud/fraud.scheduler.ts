import { Injectable, Logger } from '@nestjs/common';
import { FraudService } from './fraud.service';

/** Job bodies invoked by Vercel Cron via CronController — see apps/api/src/cron. */
@Injectable()
export class FraudScheduler {
  private readonly logger = new Logger(FraudScheduler.name);

  constructor(private readonly fraudService: FraudService) {}

  async enqueueRecurringAnomalyScan() {
    await this.fraudService.enqueueAnomalyScan('scheduled');
    this.logger.log('Queued scheduled anomaly scan job');
  }

  async processQueue() {
    const result = await this.fraudService.processNextQueuedJob();
    if (!result) return;
    this.logger.log(
      `Processed fraud job ${result.id} with status ${result.status}`,
    );
  }
}
