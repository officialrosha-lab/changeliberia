import {
  Controller,
  Post,
  Body,
  Logger,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { EmailTrackingService } from '../services/email-tracking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RawBodyRequest } from '../../common/middleware/raw-body.middleware';

/**
 * Maileroo webhooks — https://maileroo.com/docs/email-api/webhooks/
 *
 * Add a single callback URL in the dashboard's Events section, pointing at
 * POST /api/v1/webhooks/maileroo on this API — Maileroo delivers every
 * event type to the same URL (unlike Plunk's per-event Workflow steps).
 *
 * Payloads are signed with HMAC-SHA256 over the raw request body using a
 * shared secret (dashboard > Events), sent in the `x-maileroo-signature`
 * header as a hex digest. `rawBodyMiddleware` must run for this route
 * (wired in main.ts) so `req.rawBody` is the exact bytes Maileroo signed.
 *
 * `event_type` is one of: accepted, delivered, opened, clicked, deferred,
 * failed, complained, rejected. `message_reference_id` echoes back the
 * `reference_id` MailerooProvider generates and sends with every email,
 * which is what we store as EmailLog.resendMessageId (kept as-is to avoid
 * a schema migration for a rename across two provider swaps now).
 */

interface MailerooWebhookEvent {
  event_type?:
    | 'accepted'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'deferred'
    | 'failed'
    | 'complained'
    | 'rejected';
  event_id?: string;
  event_time?: number;
  inserted_at?: string;
  message_id?: string;
  message_reference_id?: string;
  domain_id?: number;
  user_id?: number;
  tags?: Record<string, any> | null;
  event_data?: {
    to?: string;
    link?: string;
    reason?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

@Controller('webhooks')
export class MailerooWebhookController {
  private readonly logger = new Logger(MailerooWebhookController.name);
  private readonly webhookSecret = process.env.MAILEROO_WEBHOOK_SECRET;

  constructor(
    private readonly trackingService: EmailTrackingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Maileroo webhooks
   * POST /webhooks/maileroo
   */
  @Post('maileroo')
  async handleMailerooWebhook(
    @Req() req: RawBodyRequest,
    @Body() event: MailerooWebhookEvent,
  ): Promise<{ received: boolean }> {
    if (this.webhookSecret) {
      const signature = req.get('x-maileroo-signature');
      if (!signature || !this.isValidSignature(req.rawBody, signature)) {
        this.logger.warn('Invalid or missing Maileroo webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        'MAILEROO_WEBHOOK_SECRET is not configured — rejecting webhook in production',
      );
      throw new UnauthorizedException(
        'Webhook signature verification is not configured',
      );
    }

    const type = event.event_type;
    this.logger.log(`Received Maileroo webhook: ${type ?? 'unknown'}`);
    this.logger.debug(`Maileroo webhook payload: ${JSON.stringify(event)}`);

    try {
      switch (type) {
        case 'delivered':
          await this.handleDelivered(event);
          break;
        case 'failed':
        case 'rejected':
          await this.handleFailed(event);
          break;
        case 'complained':
          await this.handleComplained(event);
          break;
        case 'opened':
          await this.handleOpened(event);
          break;
        case 'clicked':
          await this.handleClicked(event);
          break;
        default:
          this.logger.debug(
            `Unhandled or unrecognized Maileroo event: ${type}`,
          );
      }

      return { received: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to handle Maileroo webhook: ${message}`);
      // Don't throw - a non-2xx response makes Maileroo keep retrying this event.
      return { received: true };
    }
  }

  private isValidSignature(
    rawBody: Buffer | undefined,
    signature: string,
  ): boolean {
    if (!rawBody || !this.webhookSecret) return false;
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  }

  private async handleDelivered(event: MailerooWebhookEvent): Promise<void> {
    const messageId = event.message_reference_id;
    if (!messageId) return;

    await this.trackingService.recordDelivery(messageId);
    this.logger.log(`Email delivered: ${messageId}`);
  }

  private async handleFailed(event: MailerooWebhookEvent): Promise<void> {
    const messageId = event.message_reference_id;
    if (!messageId) return;
    const reason = event.event_data?.reason || `Email ${event.event_type}`;

    await this.trackingService.recordBounce(messageId, reason);

    // A failed/rejected send means the address is undeliverable — stop emailing it.
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
        `User ${emailLog.userId} unsubscribed due to ${event.event_type} email`,
      );
    }
  }

  private async handleComplained(event: MailerooWebhookEvent): Promise<void> {
    const messageId = event.message_reference_id;
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

  private async handleOpened(event: MailerooWebhookEvent): Promise<void> {
    const messageId = event.message_reference_id;
    if (!messageId) return;

    // recordOpen/recordClick key off the internal EmailLog id, not the
    // provider reference id, so resolve it first.
    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: messageId },
    });
    if (!emailLog) return;

    await this.trackingService.recordOpen(emailLog.id);
    this.logger.debug(`Email opened: ${messageId}`);
  }

  private async handleClicked(event: MailerooWebhookEvent): Promise<void> {
    const messageId = event.message_reference_id;
    if (!messageId) return;
    const linkId = event.event_data?.link || 'unknown';

    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: messageId },
    });
    if (!emailLog) return;

    await this.trackingService.recordClick(emailLog.id, linkId);
    this.logger.debug(`Email clicked: ${messageId} - Link: ${linkId}`);
  }
}
