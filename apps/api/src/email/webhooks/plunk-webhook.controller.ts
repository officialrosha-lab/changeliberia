import {
  Controller,
  Post,
  Body,
  Logger,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailTrackingService } from '../services/email-tracking.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Plunk webhooks — https://docs.useplunk.com/guides/webhooks
 *
 * Plunk has no built-in "add a webhook URL" list like MailerSend/Resend.
 * Instead, each event is wired up as a Workflow (dashboard > Workflows)
 * triggered by an event (e.g. `email.bounce`) with a WEBHOOK step pointing
 * at POST /webhooks/plunk on this API. Repeat per event you want delivered
 * here: email.delivery, email.bounce, email.complaint, email.open, email.click.
 *
 * Plunk doesn't sign payloads with HMAC. Instead, set a shared secret as a
 * custom header on each workflow's webhook step, e.g.
 *   Authorization: Bearer <PLUNK_WEBHOOK_SECRET>
 * and this controller checks the header matches.
 *
 * The default webhook body has no explicit event-type field, so the event
 * kind below is inferred from which `event.*` fields are present (bounce
 * payloads carry `bounceType`, opens carry `opens`, etc — see
 * inferEventType). This wasn't verified against a live payload; if it
 * doesn't work, either check the `Plunk webhook payload:` debug log below to
 * confirm the real field names, or add a custom Body on the workflow's
 * webhook step with an explicit `"type": "email.bounce"` field and read
 * `event.type` directly instead.
 */

interface PlunkWebhookEvent {
  type?: string;
  contact?: {
    email?: string;
    subscribed?: boolean;
    data?: Record<string, any>;
  };
  event?: {
    subject?: string;
    from?: string;
    fromName?: string;
    messageId?: string;
    emailId?: string;
    templateId?: string;
    campaignId?: string;
    sourceType?: string;
    sentAt?: string;
    deliveredAt?: string;
    openedAt?: string;
    opens?: number;
    isFirstOpen?: boolean;
    link?: string;
    clickedAt?: string;
    clicks?: number;
    isFirstClick?: boolean;
    bounceType?: 'Permanent' | 'Transient';
    bouncedAt?: string;
    transientBounce?: boolean;
    complainedAt?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

@Controller('webhooks')
export class PlunkWebhookController {
  private readonly logger = new Logger(PlunkWebhookController.name);
  private readonly webhookSecret = process.env.PLUNK_WEBHOOK_SECRET;

  constructor(
    private readonly trackingService: EmailTrackingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Plunk webhooks
   * POST /webhooks/plunk
   */
  @Post('plunk')
  async handlePlunkWebhook(
    @Req() req: Request,
    @Body() event: PlunkWebhookEvent,
  ): Promise<{ received: boolean }> {
    if (this.webhookSecret) {
      const authHeader = req.get('authorization');
      if (authHeader !== `Bearer ${this.webhookSecret}`) {
        this.logger.warn('Invalid or missing Plunk webhook secret');
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    const type = event.type || this.inferEventType(event.event);
    this.logger.log(`Received Plunk webhook: ${type ?? 'unknown'}`);
    this.logger.debug(`Plunk webhook payload: ${JSON.stringify(event)}`);

    try {
      switch (type) {
        case 'email.delivery':
          await this.handleDelivered(event);
          break;
        case 'email.bounce':
          await this.handleBounced(event);
          break;
        case 'email.complaint':
          await this.handleComplained(event);
          break;
        case 'email.open':
          await this.handleOpened(event);
          break;
        case 'email.click':
          await this.handleClicked(event);
          break;
        default:
          this.logger.debug(`Unhandled or unrecognized Plunk event: ${type}`);
      }

      return { received: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to handle Plunk webhook: ${message}`);
      // Don't throw - a non-2xx response fails the Plunk workflow step with no retry.
      return { received: true };
    }
  }

  /** Best-effort event-type detection — see the class doc comment above. */
  private inferEventType(e?: PlunkWebhookEvent['event']): string | undefined {
    if (!e) return undefined;
    if (e.bounceType) return 'email.bounce';
    if (e.complainedAt) return 'email.complaint';
    if (e.clickedAt || typeof e.clicks === 'number') return 'email.click';
    if (e.openedAt || typeof e.opens === 'number') return 'email.open';
    if (e.deliveredAt) return 'email.delivery';
    if (e.sentAt) return 'email.sent';
    return undefined;
  }

  private messageId(event: PlunkWebhookEvent): string | undefined {
    return event.event?.emailId || event.event?.messageId;
  }

  private async handleDelivered(event: PlunkWebhookEvent): Promise<void> {
    const messageId = this.messageId(event);
    if (!messageId) return;

    await this.trackingService.recordDelivery(messageId);
    this.logger.log(`Email delivered: ${messageId}`);
  }

  private async handleBounced(event: PlunkWebhookEvent): Promise<void> {
    const messageId = this.messageId(event);
    if (!messageId) return;
    const isHardBounce = event.event?.bounceType === 'Permanent';
    const reason = isHardBounce ? 'Hard bounce' : 'Soft bounce';

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

  private async handleComplained(event: PlunkWebhookEvent): Promise<void> {
    const messageId = this.messageId(event);
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

  private async handleOpened(event: PlunkWebhookEvent): Promise<void> {
    const messageId = this.messageId(event);
    if (!messageId) return;

    // recordOpen/recordClick key off the internal EmailLog id, not the
    // provider message id, so resolve it first.
    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: messageId },
    });
    if (!emailLog) return;

    await this.trackingService.recordOpen(emailLog.id);
    this.logger.debug(`Email opened: ${messageId}`);
  }

  private async handleClicked(event: PlunkWebhookEvent): Promise<void> {
    const messageId = this.messageId(event);
    if (!messageId) return;
    const linkId = event.event?.link || 'unknown';

    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: messageId },
    });
    if (!emailLog) return;

    await this.trackingService.recordClick(emailLog.id, linkId);
    this.logger.debug(`Email clicked: ${messageId} - Link: ${linkId}`);
  }
}
