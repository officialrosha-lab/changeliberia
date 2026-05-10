import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailLog } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EmailTrackingService {
  private readonly logger = new Logger(EmailTrackingService.name);
  private readonly trackingDomain =
    process.env.TRACKING_DOMAIN || 'track.changeliberia.org';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique tracking pixel ID for an email
   */
  generateTrackingPixelId(): string {
    return uuid();
  }

  /**
   * Generate tracking pixel URL
   */
  generateTrackingPixelUrl(emailLogId: string, pixelId: string): string {
    return `https://${this.trackingDomain}/track/open/${emailLogId}/${pixelId}`;
  }

  /**
   * Generate click tracking URL wrapper
   */
  generateClickTrackingUrl(
    emailLogId: string,
    originalUrl: string,
    linkId: string = 'cta',
  ): string {
    const encoded = Buffer.from(originalUrl).toString('base64');
    return `https://${this.trackingDomain}/track/click/${emailLogId}/${linkId}?redirect=${encoded}`;
  }

  /**
   * Record email open event
   */
  async recordOpen(emailLogId: string): Promise<EmailLog | null> {
    try {
      const emailLog = await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          openedAt: new Date(),
          status: 'OPENED',
        },
      });

      this.logger.debug(`Email opened tracked: ${emailLogId}`);
      return emailLog;
    } catch (error) {
      this.logger.error(
        `Failed to record email open for ${emailLogId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Record click event on email link
   */
  async recordClick(emailLogId: string, linkId?: string): Promise<EmailLog | null> {
    try {
      const emailLog = await this.prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          clickedAt: new Date(),
          metadata: linkId
            ? JSON.stringify({ lastClickedLink: linkId })
            : undefined,
        },
      });

      this.logger.debug(
        `Email click tracked: ${emailLogId} - Link: ${linkId || 'unknown'}`,
      );
      return emailLog;
    } catch (error) {
      this.logger.error(
        `Failed to record email click for ${emailLogId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Record delivery event (from Resend webhook)
   */
  async recordDelivery(resendMessageId: string): Promise<EmailLog | null> {
    try {
      const updateResult = await this.prisma.emailLog.updateMany({
        where: { resendMessageId },
        data: {
          deliveredAt: new Date(),
          status: 'DELIVERED',
        },
      });

      if (updateResult.count > 0) {
        const emailLog = await this.prisma.emailLog.findFirst({
          where: { resendMessageId },
        });
        this.logger.debug(`Email delivered tracked: ${resendMessageId}`);
        return emailLog;
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to record delivery for ${resendMessageId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Record bounce event (from Resend webhook)
   */
  async recordBounce(resendMessageId: string, reason?: string): Promise<EmailLog | null> {
    try {
      const updateResult = await this.prisma.emailLog.updateMany({
        where: { resendMessageId },
        data: {
          bouncedAt: new Date(),
          status: 'BOUNCED',
          failureReason: reason || 'Email bounced',
        },
      });

      if (updateResult.count > 0) {
        const emailLog = await this.prisma.emailLog.findFirst({
          where: { resendMessageId },
        });
        this.logger.warn(`Email bounced: ${resendMessageId} - ${reason}`);
        return emailLog;
      }
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to record bounce for ${resendMessageId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    openRate: number;
    clickRate: number;
  }> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, sent, delivered, opened, clicked, bounced, failed] = await Promise.all([
      this.prisma.emailLog.count({ where }),
      this.prisma.emailLog.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.emailLog.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.emailLog.count({ where: { ...where, openedAt: { not: null } } }),
      this.prisma.emailLog.count({ where: { ...where, clickedAt: { not: null } } }),
      this.prisma.emailLog.count({ where: { ...where, status: 'BOUNCED' } }),
      this.prisma.emailLog.count({ where: { ...where, status: 'FAILED' } }),
    ]);

    const openRate = total > 0 ? (opened / total) * 100 : 0;
    const clickRate = total > 0 ? (clicked / total) * 100 : 0;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      openRate: parseFloat(openRate.toFixed(2)),
      clickRate: parseFloat(clickRate.toFixed(2)),
    };
  }
}
