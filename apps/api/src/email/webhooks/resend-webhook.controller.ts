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
 * Resend webhook events for email delivery, bounces, and complaints
 * https://resend.com/docs/api-reference/webhooks
 */

export interface ResendWebhookEvent {
  type: 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string;
    created_at?: string;
    [key: string]: any;
  };
}

@Controller('webhooks')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);
  private readonly webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  constructor(
    private readonly trackingService: EmailTrackingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Resend webhooks
   * POST /webhooks/resend
   */
  @Post('resend')
  async handleResendWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() event: ResendWebhookEvent,
  ): Promise<{ received: boolean }> {
    // Verify webhook signature if secret is configured
    if (this.webhookSecret) {
      const signature = req.get('svix-signature');
      if (!signature || !this.verifySignature(req.rawBody, signature)) {
        this.logger.warn('Invalid Resend webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    this.logger.log(`Received Resend webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'email.delivered':
          await this.handleDelivered(event);
          break;
        case 'email.bounced':
          await this.handleBounced(event);
          break;
        case 'email.complained':
          await this.handleComplained(event);
          break;
        case 'email.opened':
          await this.handleOpened(event);
          break;
        case 'email.clicked':
          await this.handleClicked(event);
          break;
        default:
          this.logger.warn(`Unknown Resend event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Failed to handle Resend webhook: ${error}`);
      // Don't throw - Resend will retry on error
      return { received: true };
    }
  }

  /**
   * Handle email delivered event
   */
  private async handleDelivered(event: ResendWebhookEvent): Promise<void> {
    const { email_id } = event.data;

    await this.trackingService.recordDelivery(email_id);
    this.logger.log(`Email delivered: ${email_id}`);
  }

  /**
   * Handle email bounced event
   */
  private async handleBounced(event: ResendWebhookEvent): Promise<void> {
    const { email_id } = event.data;
    const reason = event.data.bounce_type || 'Email bounced';

    await this.trackingService.recordBounce(email_id, reason);

    // If hard bounce, unsubscribe the user
    if (event.data.bounce_type === 'Permanent') {
      const emailLog = await this.prisma.emailLog.findFirst({
        where: { resendMessageId: email_id },
      });

      if (emailLog?.userId) {
        await this.prisma.notificationPreference.upsert({
          where: { userId: emailLog.userId },
          update: {
            emailEnabled: false,
          },
          create: {
            userId: emailLog.userId,
            emailEnabled: false,
          },
        });

        this.logger.warn(
          `User ${emailLog.userId} unsubscribed due to hard bounce`,
        );
      }
    }
  }

  /**
   * Handle email complained event (spam report)
   */
  private async handleComplained(event: ResendWebhookEvent): Promise<void> {
    const { email_id } = event.data;

    // Mark as failed and unsubscribe user
    const emailLog = await this.prisma.emailLog.findFirst({
      where: { resendMessageId: email_id },
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
          update: {
            emailEnabled: false,
          },
          create: {
            userId: emailLog.userId,
            emailEnabled: false,
          },
        });

        this.logger.warn(
          `User ${emailLog.userId} unsubscribed due to spam complaint`,
        );
      }
    }
  }

  /**
   * Handle email opened event (if enabled in Resend settings)
   */
  private async handleOpened(event: ResendWebhookEvent): Promise<void> {
    const { email_id } = event.data;

    await this.trackingService.recordOpen(email_id);
    this.logger.debug(`Email opened: ${email_id}`);
  }

  /**
   * Handle email clicked event (if enabled in Resend settings)
   */
  private async handleClicked(event: ResendWebhookEvent): Promise<void> {
    const { email_id } = event.data;
    const linkId = event.data.link_id || 'unknown';

    await this.trackingService.recordClick(email_id, linkId);
    this.logger.debug(`Email clicked: ${email_id} - Link: ${linkId}`);
  }

  /**
   * Verify Svix webhook signature
   * https://docs.svix.com/advanced/verifying-payloads
   */
  private verifySignature(body: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    try {
      // Svix signature format: v1,hash
      const [version, hash] = signature.split(',');
      if (version !== 'v1') {
        return false;
      }

      // Create HMAC-SHA256 of the body
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const computedHash = hmac.update(body).digest('base64');

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(computedHash),
      );
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error}`);
      return false;
    }
  }
}
