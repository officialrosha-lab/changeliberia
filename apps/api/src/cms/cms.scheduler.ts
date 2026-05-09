import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContentSchedulingService } from './content-scheduling.service';

/**
 * CMS Scheduler - Handles scheduled content publishing/unpublishing
 * Executes every minute to check for and process due scheduled actions
 */
@Injectable()
export class CMSScheduler {
  private readonly logger = new Logger(CMSScheduler.name);

  constructor(private readonly contentSchedulingService: ContentSchedulingService) {}

  /**
   * Execute scheduled content actions every minute
   * Checks for actions that are past their scheduled time
   */
  @Cron(CronExpression.EVERY_MINUTE)
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
