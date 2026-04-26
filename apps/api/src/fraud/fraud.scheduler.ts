import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FraudService } from './fraud.service';

@Injectable()
export class FraudScheduler {
  private readonly logger = new Logger(FraudScheduler.name);

  constructor(private readonly fraudService: FraudService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async enqueueRecurringAnomalyScan() {
    await this.fraudService.enqueueAnomalyScan('scheduled');
    this.logger.log('Queued scheduled anomaly scan job');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    const result = await this.fraudService.processNextQueuedJob();
    if (!result) return;
    this.logger.log(
      `Processed fraud job ${result.id} with status ${result.status}`,
    );
  }
}
