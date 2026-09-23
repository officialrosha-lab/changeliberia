import {
  Controller,
  Post,
  Body,
  Logger,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailTrackingService } from '../services/email-tracking.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * MailerSend webhook events for email delivery, bounces, and complaints.
 * https://developers.mailersend.com/api/v1/webhooks.html
 *
 * Field paths below (bounce reason, click link id) are based on MailerSend's
 * documented activity payload shape but weren't verified against a live
 * account — log level is left at debug for the raw event so you can confirm
 * the exact shape against real webhook deliveries and adjust if needed.
 */

export interface MailerSendWebhookEvent {
  type:
    | 'activity.sent'
    | 'activity.delivered'
    | 'activity.soft_bounced'
    | 'activity.hard_bounced'
    | 'activity.opened'
    | 'activity.clicked'
    | 'activity.unsubscribed'
    | 'activity.spam_complaint';
  created_at: string;
  webhook_id?: string;
  data: {
    object: string;
    id: string;
    type: string;
    created_at?: string;
    email: {
      id: string;
      from?: string;
      subject?: string;
      status?: string;
      tags?: string[] | null;
      created_at?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

@Controller('webhooks')
export class MailerSendWebhookController {
  private readonly logger = new Logger(MailerSendWebhookController.name);
  private readonly webhookSecret = process.env.MAILERSEND_WEBHOOK_SECRET;

  constructor(
    private readonly trackingService: EmailTrackingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle MailerSend webhooks
   * POST /webhooks/mailersend
   */
  @Post('mailersend')
  async handleMailerSendWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() event: MailerSendWebhookEvent,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature if secret is configured
    if (this.webhookSecret) {
      const signature = req.get('signature');
      if (!signature || !req.rawBody || !this.verifySignature(req.rawBody, signature)) {
        this.logger.warn('Invalid MailerSend webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    this.logger.log(`Received MailerSend webhook: ${event.type}`);
    this.logger.debug(`MailerSend webhook payload: ${JSON.stringify(event)}`);

    try {
      switch (event.type) {
        case 'activity.delivered':
          await this.handleDelivered(event);
          break;
        case 'activity.soft_bounced':
        case 'activity.hard_bounced':
          await this.handleBounced(event);
          break;
        case 'activity.spam_complaint':
          await this.handleComplained(event);
          break;
        case 'activity.opened':
          await this.handleOpened(event);
          break;
        case 'activity.clicked':
          await this.handleClicked(event);
          break;
        default:
          this.logger.debug(`Unhandled MailerSend event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to handle MailerSend webhook: ${message}`);
      // Don't throw - MailerSend will retry on error
      return { received: true };
    }
  }

  private async handleDelivered(event: MailerSendWebhookEvent): Promise<void> {
    const messageId = event.data.email?.id;
    if (!messageId) return;

    await this.trackingService.recordDelivery(messageId);
    this.logger.log(`Email delivered: ${messageId}`);
  }

  private async handleBounced(event: MailerSendWebhookEvent): Promise<void> {
    const messageId = event.data.email?.id;
    if (!messageId) return;
    const isHardBounce = event.type === 'activity.hard_bounced';
    // Exact reason field wasn't confirmed against a live payload — falls
    // back to a generic label; check `MailerSend webhook payload:` debug
    // logs above to find the real field name and refine this if needed.
    const reason = event.data.email?.status || (isHardBounce ? 'Hard bounce' : 'Soft bounce');

    await this.trackingService.recordBounce(messageId, reason);

    // Hard bounces mean the address is invalid — stop emailing it.
    if (isHardBounce) {
      const emailLog = await this.prisma.emailLog.findFirst({
        where: { resendMessageId: messageId },
      });

      if (emailLog?.userId) {
        await this.prisma.notificationPreference.upsert({
          where: { userId: emailLog.userId },
          update: { emailEnabled: false },
          create: { userId: emailLog.userId, emailEnabled: false },
        });

        this.logger.warn(
          `User ${emailLog.userId} unsubscribed due to hard bounce`,
        );
      }
    }
  }

  private async handleComplained(event: MailerSendWebhookEvent): Promise<void> {
    const messageId = event.data.email?.id;
    if (!messageId) return;

    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: messageId },
    });

    if (emailLog) {
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          failureReason: 'Email marked as spam by recipient',
        },
      });

      if (emailLog.userId) {
        await this.prisma.notificationPreference.upsert({
          where: { userId: emailLog.userId },
          update: { emailEnabled: false },
          create: { userId: emailLog.userId, emailEnabled: false },
        });

        this.logger.warn(
          `User ${emailLog.userId} unsubscribed due to spam complaint`,
        );
      }
    }
  }

  private async handleOpened(event: MailerSendWebhookEvent): Promise<void> {
    const messageId = event.data.email?.id;
    if (!messageId) return;

    await this.trackingService.recordOpen(messageId);
    this.logger.debug(`Email opened: ${messageId}`);
  }

  private async handleClicked(event: MailerSendWebhookEvent): Promise<void> {
    const messageId = event.data.email?.id;
    if (!messageId) return;
    // Exact click-link field wasn't confirmed against a live payload — see
    // the `MailerSend webhook payload:` debug log above to find it.
    const linkId = event.data.link_id || 'unknown';

    await this.trackingService.recordClick(messageId, linkId);
    this.logger.debug(`Email clicked: ${messageId} - Link: ${linkId}`);
  }

  /**
   * Verify MailerSend's HMAC-SHA256 webhook signature.
   * https://developers.mailersend.com/api/v1/webhooks.html#webhook-signature
   */
  private verifySignature(body: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    try {
      const computedHash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      const sigBuf = Buffer.from(signature);
      const computedBuf = Buffer.from(computedHash);
      if (sigBuf.length !== computedBuf.length) return false;

      return crypto.timingSafeEqual(sigBuf, computedBuf);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Signature verification failed: ${message}`);
      return false;
    }
  }
}
