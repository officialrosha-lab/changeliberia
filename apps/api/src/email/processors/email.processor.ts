import { Processor, Process, OnWorkerEvent } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ResendProvider } from '../providers/resend.provider';
import { EmailTrackingService } from '../services/email-tracking.service';
import { BULL_EMAIL_QUEUE } from '../email.constants';

export interface SendEmailJobData {
  emailLogId: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  emailType: string;
  isTransactional?: boolean;
  userId?: string;
}

@Processor(BULL_EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendProvider: ResendProvider,
    private readonly trackingService: EmailTrackingService,
  ) {}

  /**
   * Main job handler for sending emails
   */
  @Process('send-email')
  async handleSendEmail(job: Job<SendEmailJobData>): Promise<string> {
    const { emailLogId, recipient, subject, html, text, emailType } = job.data;

    this.logger.log(`Processing email job: ${job.id} (EmailLog: ${emailLogId})`);

    try {
      // Update email log to PROCESSING
      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: { status: 'PROCESSING' },
      });

      // Send via Resend
      const result = await this.resendProvider.send({
        to: recipient,
        from: process.env.MAIL_FROM || 'noreply@changeliberia.org',
        replyTo: process.env.MAIL_REPLY_TO || 'support@changeliberia.org',
        subject,
        html,
        text,
        tags: [emailType],
        headers: {
          'X-Email-Log-ID': emailLogId,
          'X-Email-Type': emailType,
        },
      });

      // Update email log with Resend response
      await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          resendMessageId: result.id,
          retryCount: job.attemptsMade || 0,
        },
      });

      this.logger.log(
        `Email sent successfully: ${emailLogId} (Resend ID: ${result.id})`,
      );

      return result.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email (attempt ${job.attemptsMade || 0}): ${emailLogId} - ${errorMessage}`,
      );

      // Check if this is the last attempt
      const maxAttempts = 3;
      const isLastAttempt = (job.attemptsMade || 0) >= maxAttempts;

      if (isLastAttempt) {
        // Mark as failed
        await this.prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: 'FAILED',
            failureReason: errorMessage,
            retryCount: job.attemptsMade || 0,
          },
        });

        this.logger.error(
          `Email permanently failed after ${maxAttempts} attempts: ${emailLogId}`,
        );
      }

      // Rethrow to trigger BullMQ retry logic
      throw error;
    }
  }

  /**
   * Track email open
   */
  @Process('track-open')
  async handleTrackOpen(job: Job<{ emailLogId: string }>): Promise<void> {
    const { emailLogId } = job.data;

    try {
      await this.trackingService.recordOpen(emailLogId);
      this.logger.debug(`Email open tracked: ${emailLogId}`);
    } catch (error) {
      this.logger.error(`Failed to track email open: ${emailLogId} - ${error}`);
    }
  }

  /**
   * Track email click
   */
  @Process('track-click')
  async handleTrackClick(
    job: Job<{ emailLogId: string; linkId?: string }>,
  ): Promise<void> {
    const { emailLogId, linkId } = job.data;

    try {
      await this.trackingService.recordClick(emailLogId, linkId);
      this.logger.debug(`Email click tracked: ${emailLogId} - Link: ${linkId}`);
    } catch (error) {
      this.logger.error(
        `Failed to track email click: ${emailLogId} - ${error}`,
      );
    }
  }

  /**
   * Retry failed emails
   */
  @Process('retry-failed')
  async handleRetryFailed(): Promise<number> {
    this.logger.log('Starting retry of failed emails...');

    try {
      // Find failed emails with retry count < 3 and older than 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const failedEmails = await this.prisma.emailLog.findMany({
        where: {
          status: 'FAILED',
          retryCount: { lt: 3 },
          createdAt: { lt: fifteenMinutesAgo },
        },
        take: 100, // Limit batch size
      });

      if (failedEmails.length === 0) {
        this.logger.debug('No failed emails to retry');
        return 0;
      }

      this.logger.log(`Found ${failedEmails.length} failed emails to retry`);

      // Reset status to QUEUED and let normal flow retry them
      await this.prisma.emailLog.updateMany({
        where: {
          id: { in: failedEmails.map((e) => e.id) },
        },
        data: {
          status: 'QUEUED',
          retryCount: { increment: 1 },
        },
      });

      return failedEmails.length;
    } catch (error) {
      this.logger.error(`Failed to process retry job: ${error}`);
      throw error;
    }
  }

  /**
   * Worker event: job completed
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Job completed: ${job.id} - ${job.name}`);
  }

  /**
   * Worker event: job failed
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job failed: ${job.id} (${job.name}) - ${error.message}`,
    );
  }

  /**
   * Worker event: job retried
   */
  @OnWorkerEvent('stalled')
  onStalled(job: Job): void {
    this.logger.warn(`Job stalled: ${job.id} (${job.name})`);
  }
}
