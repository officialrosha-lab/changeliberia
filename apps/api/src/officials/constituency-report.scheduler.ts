import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConstituencyReportPeriod } from '@prisma/client';
import { ConstituencyReportService } from './constituency-report.service';

@Injectable()
export class ConstituencyReportScheduler {
  private readonly logger = new Logger(ConstituencyReportScheduler.name);

  constructor(private readonly reportService: ConstituencyReportService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async enqueueWeeklyReports() {
    const count = await this.reportService.enqueueScheduledReports(
      ConstituencyReportPeriod.WEEKLY,
    );
    if (count > 0)
      this.logger.log(`Queued ${count} weekly constituency reports`);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async enqueueMonthlyReports() {
    const count = await this.reportService.enqueueScheduledReports(
      ConstituencyReportPeriod.MONTHLY,
    );
    if (count > 0)
      this.logger.log(`Queued ${count} monthly constituency reports`);
  }

  @Cron('0 0 1 1,4,7,10 *')
  async enqueueQuarterlyReports() {
    const count = await this.reportService.enqueueScheduledReports(
      ConstituencyReportPeriod.QUARTERLY,
    );
    if (count > 0)
      this.logger.log(`Queued ${count} quarterly constituency reports`);
  }

  @Cron(CronExpression.EVERY_YEAR)
  async enqueueAnnualReports() {
    const count = await this.reportService.enqueueScheduledReports(
      ConstituencyReportPeriod.ANNUAL,
    );
    if (count > 0)
      this.logger.log(`Queued ${count} annual constituency reports`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    const result = await this.reportService.processNextQueuedReport();
    if (!result) return;
    this.logger.log(
      `Processed constituency report ${result.id} with status ${result.status}`,
    );
  }
}
