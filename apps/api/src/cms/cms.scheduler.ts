import { Injectable, Logger } from '@nestjs/common';
import { ContentSchedulingService } from './content-scheduling.service';

/**
 * CMS Scheduler - handles scheduled content publishing/unpublishing.
 * Invoked every minute by Vercel Cron via CronController — see apps/api/src/cron.
 */
@Injectable()
export class CMSScheduler {
  private readonly logger = new Logger(CMSScheduler.name);

  constructor(private readonly contentSchedulingService: ContentSchedulingService) {}

  async executeScheduledActions() {
    try {
      this.logger.debug('Starting scheduled content action execution');
      await this.contentSchedulingService.executeScheduledActions();
      this.logger.debug('Completed scheduled content action execution');
    } catch (error) {
      this.logger.error('Error executing scheduled content actions:', error);
    }
  }
}
