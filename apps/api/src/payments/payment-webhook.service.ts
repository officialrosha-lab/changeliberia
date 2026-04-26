import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEventHandlerService } from './webhook-event-handler.service';
import { WEBHOOK_CONFIG, PaymentErrorCode } from './payments.constants';
import { RawBodyRequest } from '../common/middleware/raw-body.middleware';

/**
 * Stripe webhook event type (not exported from Stripe SDK)
 */
interface StripeWebhookEvent {
  id: string;
  type: string;
  [key: string]: any;
}

/**
 * Service to handle Stripe webhook processing
 * Validates signatures, prevents duplicates, routes to event handlers
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventHandler: WebhookEventHandlerService,
  ) {
    // Initialize Stripe instance
    this.stripe = new Stripe(process.env.STRIPE_API_KEY || '');

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured!');
    }
  }

  /**
   * Main webhook processing method
   * Called from PaymentController webhook endpoint
   */
  async processWebhook(req: RawBodyRequest): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody;

    // Validate inputs
    this.validateWebhookInputs(signature, rawBody);

    // Verify webhook signature
    const event = this.verifyWebhookSignature(rawBody!, signature);

    // Check for duplicate processing
    const isDuplicate = await this.isDuplicateEvent(event.id);
    if (isDuplicate) {
      this.logger.warn(`Duplicate webhook event detected: ${event.id}`);
      return;
    }

    // Record event processing
    await this.recordWebhookEvent(event.id, JSON.stringify(event));

    // Route to appropriate handler
    try {
      await this.eventHandler.handleWebhookEvent(event);
      this.logger.log(
        `Webhook event ${event.type} (${event.id}) processed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing webhook event ${event.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Re-throw to return 500, allowing Stripe to retry
      throw new InternalServerErrorException(
        'Webhook processing failed - will retry',
      );
    }
  }

  /**
   * Validate webhook request inputs
   */
  /**
   * Validate webhook request inputs
   */
  private validateWebhookInputs(
    signature: string,
    rawBody: Buffer | undefined,
  ) {
    if (!signature) {
      this.logger.error('Missing Stripe-Signature header');
      throw new BadRequestException(
        PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED,
      );
    }

    if (!rawBody) {
      this.logger.error('Missing raw request body');
      throw new BadRequestException('Invalid request body');
    }

    if (!this.webhookSecret) {
      this.logger.error('Webhook secret not configured');
      throw new InternalServerErrorException('Webhook configuration error');
    }
  }

  /**
   * Verify Stripe webhook signature
   * Implements HMAC-SHA256 signature verification as per Stripe docs
   */
  private verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
  ): StripeWebhookEvent {
    try {
      // Parse signature header to extract timestamp and signatures
      const signatureHeader = this.parseSignatureHeader(signature);

      // Check timestamp freshness
      this.validateTimestamp(signatureHeader.timestamp);

      // Verify signature using Stripe library
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      this.logger.debug(
        `Webhook signature verified: ${event.type} (${event.id})`,
      );

      return event;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        this.logger.error(
          `Stripe signature verification failed: ${error.message}`,
        );
        throw new BadRequestException(
          PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED,
        );
      }

      this.logger.error(
        `Webhook verification error: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        PaymentErrorCode.WEBHOOK_VERIFICATION_FAILED,
      );
    }
  }

  /**
   * Parse Stripe-Signature header
   * Format: t=<timestamp>,v1=<signature>[,v0=<signature>]
   */
  private parseSignatureHeader(signature: string): {
    timestamp: number;
    signatures: string[];
  } {
    const parts = signature.split(',');
    let timestamp = 0;
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      throw new BadRequestException('Invalid signature header format');
    }

    return { timestamp, signatures };
  }

  /**
   * Validate webhook timestamp freshness
   * Prevents replay attacks
   */
  private validateTimestamp(timestamp: number) {
    const tolerance = WEBHOOK_CONFIG.TIMESTAMP_TOLERANCE;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTime - timestamp);

    if (timeDifference > tolerance) {
      this.logger.error(
        `Webhook timestamp outside tolerance: ${timeDifference}s (max ${tolerance}s)`,
      );
      throw new BadRequestException('Webhook timestamp outside tolerance');
    }

    this.logger.debug(`Webhook timestamp validated: ${timeDifference}s old`);
  }

  /**
   * Check if webhook event has already been processed
   * Prevents duplicate processing of the same event
   */
  private async isDuplicateEvent(eventId: string): Promise<boolean> {
    try {
      const existing = await this.prisma.webhookEventLog.findUnique({
        where: { stripeEventId: eventId },
      });

      return !!existing;
    } catch {
      // If webhook event log table doesn't exist yet, check Payment table instead
      this.logger.debug(
        'Webhook event log table not available, skipping duplicate check',
      );
      return false;
    }
  }

  /**
   * Record webhook event as processed
   * Enables deduplication of retried webhooks
   */
  private async recordWebhookEvent(
    eventId: string,
    payload: string = '{}',
  ): Promise<void> {
    try {
      await this.prisma.webhookEventLog.upsert({
        where: { stripeEventId: eventId },
        update: { processedAt: new Date() },
        create: {
          stripeEventId: eventId,
          eventType: 'unknown',
          payload,
          processedAt: new Date(),
        },
      });

      this.logger.debug(`Recorded webhook event: ${eventId}`);
    } catch (error) {
      // Webhook event log table may not exist yet
      this.logger.debug(
        'Could not record webhook event: ' + (error as Error).message,
      );
    }
  }

  /**
   * Get webhook processing statistics (for monitoring)
   */
  async getWebhookStats(): Promise<{
    totalEvents: number;
    lastProcessedAt: Date | null;
    eventsInLast24Hours: number;
  }> {
    try {
      const totalEvents = await this.prisma.webhookEventLog.count();

      const lastEvent = await this.prisma.webhookEventLog.findFirst({
        orderBy: { processedAt: 'desc' },
        take: 1,
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentEvents = await this.prisma.webhookEventLog.count({
        where: { processedAt: { gte: oneDayAgo } },
      });

      return {
        totalEvents,
        lastProcessedAt: lastEvent?.processedAt || null,
        eventsInLast24Hours: recentEvents,
      };
    } catch (error) {
      this.logger.warn(
        'Could not retrieve webhook stats: ' + (error as Error).message,
      );
      return {
        totalEvents: 0,
        lastProcessedAt: null,
        eventsInLast24Hours: 0,
      };
    }
  }

  /**
   * Health check for webhook endpoint
   * Can be called to verify service is operational
   */
  healthCheck(): {
    status: string;
    webhookConfigured: boolean;
    signatureSecretSet: boolean;
  } {
    return {
      status: 'ok',
      webhookConfigured: !!this.webhookSecret,
      signatureSecretSet: this.webhookSecret.length > 0,
    };
  }
}
