import { Controller, Logger, Get, UseGuards } from '@nestjs/common';
import { CronAuthGuard } from './cron-auth.guard';
import { FraudScheduler } from '../fraud/fraud.scheduler';
import { CMSScheduler } from '../cms/cms.scheduler';
import { MessagesScheduler } from '../messages/messages.scheduler';
import { PetitionsScheduler } from '../petitions/petitions.scheduler';
import { EmailScheduleService } from '../email/services/email-schedule.service';

/**
 * Endpoints invoked by Vercel Cron (see vercel.json `crons`) in place of the
 * in-process @nestjs/schedule jobs this app used on Railway. Each replaces
 * exactly one former @Cron method — same logic, HTTP-triggered instead of
 * timer-triggered, since serverless functions don't keep a scheduler running.
 */
@Controller('internal/cron')
@UseGuards(CronAuthGuard)
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly fraudScheduler: FraudScheduler,
    private readonly cmsScheduler: CMSScheduler,
    private readonly messagesScheduler: MessagesScheduler,
    private readonly petitionsScheduler: PetitionsScheduler,
    private readonly emailSchedule: EmailScheduleService,
  ) {}

  @Get('fraud-enqueue-anomaly-scan')
  async fraudEnqueueAnomalyScan() {
    await this.fraudScheduler.enqueueRecurringAnomalyScan();
    return { ok: true };
  }

  @Get('fraud-process-queue')
  async fraudProcessQueue() {
    await this.fraudScheduler.processQueue();
    return { ok: true };
  }

  @Get('cms-execute-scheduled-actions')
  async cmsExecuteScheduledActions() {
    await this.cmsScheduler.executeScheduledActions();
    return { ok: true };
  }

  @Get('messages-archive')
  async messagesArchive() {
    const result = await this.messagesScheduler.handleMessageArchival();
    return { ok: true, result };
  }

  @Get('petitions-reset-daily-signatures')
  async petitionsResetDailySignatures() {
    await this.petitionsScheduler.resetDailySignatures();
    return { ok: true };
  }

  @Get('email-weekly-digests')
  async emailWeeklyDigests() {
    await this.emailSchedule.sendWeeklyDigests();
    return { ok: true };
  }

  @Get('email-retry-failed')
  async emailRetryFailed() {
    await this.emailSchedule.retryFailedEmails();
    return { ok: true };
  }

  @Get('email-cleanup-old-logs')
  async emailCleanupOldLogs() {
    await this.emailSchedule.cleanupOldEmailLogs();
    return { ok: true };
  }

  @Get('email-archive-completed-jobs')
  async emailArchiveCompletedJobs() {
    await this.emailSchedule.archiveCompletedJobs();
    return { ok: true };
  }

  @Get('email-generate-daily-analytics')
  async emailGenerateDailyAnalytics() {
    await this.emailSchedule.generateDailyAnalytics();
    return { ok: true };
  }
}
