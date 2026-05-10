import { Injectable, Logger, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BULL_EMAIL_QUEUE } from '../email.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { ResendProvider } from '../providers/resend.provider';
import { EmailTemplateService } from './email-template.service';
import { EmailTrackingService } from './email-tracking.service';
import { EmailPreferenceService } from './email-preference.service';
import { EmailLog, EmailType } from '@prisma/client';
import { EmailTemplateProps } from '../templates/index';

export interface QueuedEmailResult {
  emailLogId: string;
  jobId: string | number;
  queuedAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(BULL_EMAIL_QUEUE) private emailQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly resendProvider: ResendProvider,
    private readonly templateService: EmailTemplateService,
    private readonly trackingService: EmailTrackingService,
    private readonly preferenceService: EmailPreferenceService,
  ) {}

  /**
   * Send transactional email (always sent, no preference check)
   * Used for: password reset, email verification, etc.
   */
  async sendTransactional(
    recipient: string,
    userId: string | undefined,
    emailType: EmailType,
    templateProps: any,
  ): Promise<QueuedEmailResult> {
    this.logger.debug(
      `Queueing transactional email: ${emailType} to ${recipient}`,
    );

    // Generate tracking for all emails
    const trackingPixelId = this.trackingService.generateTrackingPixelId();
    const trackingPixelUrl = this.trackingService.generateTrackingPixelUrl(
      'pending',
      trackingPixelId,
    );

    // Add tracking info to template props
    templateProps.trackingPixelUrl = trackingPixelUrl;
    if (userId) {
      const prefs = await this.preferenceService.getPreferences(userId);
      if (prefs?.unsubscribeToken) {
        templateProps.unsubscribeUrl = this.getUnsubscribeUrl(
          userId,
          prefs.unsubscribeToken,
        );
      }
    }

    // Render template
    const { html, text, subject } = await this.templateService.renderTemplate(
      emailType,
      templateProps,
    );

    // Create email log record
    const emailLog = await this.prisma.emailLog.create({
      data: {
        recipient,
        userId: userId || undefined,
        type: emailType,
        subject,
        status: 'QUEUED',
        trackingPixelId,
        metadata: JSON.stringify({
          templateProps,
          isTransactional: true,
        }),
      },
    });

    // Queue the job
    const job = await this.emailQueue.add('send-email', {
      emailLogId: emailLog.id,
      recipient,
      subject,
      html,
      text,
      emailType,
      isTransactional: true,
    });

    this.logger.log(
      `Transactional email queued: ${emailLog.id} (Job: ${job.id})`,
    );

    return {
      emailLogId: emailLog.id,
      jobId: job.id as string | number,
      queuedAt: new Date(),
    };
  }

  /**
   * Send notification email (checks preferences)
   * Used for: petition updates, signatures, comments, etc.
   */
  async sendNotification(
    userId: string,
    recipient: string,
    emailType: EmailType,
    templateProps: any,
  ): Promise<QueuedEmailResult | null> {
    // Check preferences
    const { canSend, reason } = await this.preferenceService.canSendEmail(
      userId,
      emailType,
    );

    if (!canSend) {
      this.logger.debug(
        `Email not sent to ${recipient}: ${reason || 'user preferences'}`,
      );
      return null;
    }

    this.logger.debug(
      `Queueing notification email: ${emailType} to ${recipient}`,
    );

    // Generate tracking
    const trackingPixelId = this.trackingService.generateTrackingPixelId();
    const trackingPixelUrl = this.trackingService.generateTrackingPixelUrl(
      'pending',
      trackingPixelId,
    );

    // Add tracking and unsubscribe to template
    templateProps.trackingPixelUrl = trackingPixelUrl;

    const prefs = await this.preferenceService.getPreferences(userId);
    if (prefs?.unsubscribeToken) {
      templateProps.unsubscribeUrl = this.getUnsubscribeUrl(
        userId,
        prefs.unsubscribeToken,
      );
    }

    // Render template
    const { html, text, subject } = await this.templateService.renderTemplate(
      emailType,
      templateProps,
    );

    // Create email log
    const emailLog = await this.prisma.emailLog.create({
      data: {
        recipient,
        userId,
        type: emailType,
        subject,
        status: 'QUEUED',
        trackingPixelId,
        metadata: JSON.stringify({
          templateProps,
          digestFrequency: prefs?.digestFrequency,
        }),
      },
    });

    // Queue the job
    const job = await this.emailQueue.add('send-email', {
      emailLogId: emailLog.id,
      recipient,
      subject,
      html,
      text,
      emailType,
      userId,
    });

    this.logger.log(
      `Notification email queued: ${emailLog.id} (Job: ${job.id})`,
    );

    return {
      emailLogId: emailLog.id,
      jobId: job.id as string | number,
      queuedAt: new Date(),
    };
  }

  /**
   * Send bulk emails to multiple users
   */
  async sendBulk(
    userIds: string[],
    emailType: EmailType,
    getTemplatePropsForUser: (userId: string) => Promise<any>,
  ): Promise<QueuedEmailResult[]> {
    const results: QueuedEmailResult[] = [];

    for (const userId of userIds) {
      try {
        // Get user email
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (!user?.email) {
          this.logger.warn(`User ${userId} has no email address`);
          continue;
        }

        // Get template props for this user
        const templateProps =
          await getTemplatePropsForUser(userId);

        const result = await this.sendNotification(
          userId,
          user.email,
          emailType,
          templateProps,
        );

        if (result) {
          results.push(result);
        }
      } catch (error) {
        this.logger.error(
          `Failed to queue email for user ${userId}: ${error}`,
        );
      }
    }

    this.logger.log(`Bulk emails queued: ${results.length} / ${userIds.length}`);
    return results;
  }

  /**
   * Get email log
   */
  async getEmailLog(emailLogId: string): Promise<EmailLog | null> {
    return this.prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });
  }

  /**
   * List email logs for a user
   */
  async listUserEmails(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ emails: EmailLog[]; total: number }> {
    const [emails, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.emailLog.count({ where: { userId } }),
    ]);

    return { emails, total };
  }

  /**
   * Get unsubscribe URL
   */
  private getUnsubscribeUrl(userId: string, token: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/email/unsubscribe/${userId}/${token}`;
  }
}
