import { Injectable, Logger, Optional } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../email/email-queue.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import {
  StripeEventType,
  PaymentStatus,
  SubscriptionStatus,
  PaymentErrorCode,
} from './payments.constants';

/**
 * Service to handle specific Stripe webhook event types
 * Routes webhook events to appropriate handlers
 */
@Injectable()
export class WebhookEventHandlerService {
  private readonly logger = new Logger(WebhookEventHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
    @Optional() private readonly emailQueue: EmailQueueService | null,
  ) {}

  /**
   * Route webhook event to appropriate handler based on event type
   */
  async handleWebhookEvent(event: any): Promise<void> {
    this.logger.debug(`Processing webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      // Payment Intent Events
      case StripeEventType.PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentIntentSucceeded(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.PAYMENT_INTENT_PAYMENT_FAILED:
        await this.handlePaymentIntentFailed(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.PAYMENT_INTENT_CANCELED:
        await this.handlePaymentIntentCanceled(
          event.data.object as any,
          event.id,
        );
        break;

      // Subscription Events
      case StripeEventType.CUSTOMER_SUBSCRIPTION_CREATED:
        await this.handleSubscriptionCreated(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.handleSubscriptionUpdated(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.CUSTOMER_SUBSCRIPTION_DELETED:
        await this.handleSubscriptionDeleted(
          event.data.object as any,
          event.id,
        );
        break;

      // Invoice Events
      case StripeEventType.INVOICE_PAYMENT_SUCCEEDED:
        await this.handleInvoicePaymentSucceeded(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.INVOICE_PAYMENT_FAILED:
        await this.handleInvoicePaymentFailed(
          event.data.object as any,
          event.id,
        );
        break;

      // Charge Events
      case StripeEventType.CHARGE_SUCCEEDED:
        await this.handleChargeSucceeded(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.CHARGE_FAILED:
        await this.handleChargeFailed(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.CHARGE_REFUNDED:
        await this.handleChargeRefunded(
          event.data.object as any,
          event.id,
        );
        break;

      // Customer Events
      case StripeEventType.CUSTOMER_CREATED:
        await this.handleCustomerCreated(
          event.data.object as any,
          event.id,
        );
        break;

      case StripeEventType.CUSTOMER_DELETED:
        await this.handleCustomerDeleted(
          event.data.object as any,
          event.id,
        );
        break;

      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle payment_intent.succeeded event
   * One-time payment completed successfully
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: any,
    eventId: string,
  ): Promise<void> {
    try {
      const paymentIntentId = paymentIntent.id;
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;
      const customerId = paymentIntent.customer as string | null;

      this.logger.log(
        `Payment intent succeeded: ${paymentIntentId} (${amount} ${currency})`,
      );

      // Update payment record status
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for intent: ${paymentIntentId}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          stripeChargeId: paymentIntent.charges.data[0]?.id || null,
          lastWebhookEventId: eventId,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Payment ${payment.id} marked as completed`);

      this.activityLogger.logAsync({
        userId: payment.userId ?? undefined,
        action: 'PAYMENT_COMPLETED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        description: `Stripe payment completed for payment ${payment.id}`,
        changes: {
          stripePaymentIntentId: paymentIntentId,
          amount,
          currency,
        },
      });

      // If associated with a petition, update signature count
      if (payment.petitionId) {
        await this.updatePetitionSignatureCount(payment.petitionId);
      }

      // Queue confirmation email
      if (payment.userId) {
        await this.queueConfirmationEmail(payment.id, payment.userId);
      }

      // Log analytics event
      await this.logAnalyticsEvent('payment_completed', {
        paymentId: payment.id,
        amount,
        currency,
      });
    } catch (error) {
      this.logger.error(
        `Error handling payment intent succeeded: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   * One-time payment failed
   */
  private async handlePaymentIntentFailed(
    paymentIntent: any,
    eventId: string,
  ): Promise<void> {
    try {
      const paymentIntentId = paymentIntent.id;
      const lastPaymentError = paymentIntent.last_payment_error;

      this.logger.warn(
        `Payment intent failed: ${paymentIntentId} - ${lastPaymentError?.message}`,
      );

      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for intent: ${paymentIntentId}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          lastWebhookEventId: eventId,
          failureReason: lastPaymentError?.message || 'Unknown error',
        },
      });

      this.logger.log(`Payment ${payment.id} marked as failed`);

      this.activityLogger.logAsync({
        userId: payment.userId ?? undefined,
        action: 'PAYMENT_FAILED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        description: `Stripe payment failed for payment ${payment.id}`,
        status: 'FAILED',
        errorMessage: lastPaymentError?.message ?? 'Unknown error',
        changes: {
          stripePaymentIntentId: paymentIntentId,
          reason: lastPaymentError?.message,
        },
      });

      // Queue failure notification email
      if (payment.userId) {
        await this.queueFailureEmail(payment.id, payment.userId);
      }

      // Log analytics event
      await this.logAnalyticsEvent('payment_failed', {
        paymentId: payment.id,
        reason: lastPaymentError?.message,
      });
    } catch (error) {
      this.logger.error(
        `Error handling payment intent failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle payment_intent.canceled event
   * Payment was canceled before completion
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: any,
    eventId: string,
  ): Promise<void> {
    try {
      const paymentIntentId = paymentIntent.id;

      this.logger.log(`Payment intent canceled: ${paymentIntentId}`);

      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for intent: ${paymentIntentId}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CANCELLED,
          lastWebhookEventId: eventId,
        },
      });

      this.logger.log(`Payment ${payment.id} marked as cancelled`);

      this.activityLogger.logAsync({
        userId: payment.userId ?? undefined,
        action: 'PAYMENT_CANCELLED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        description: `Stripe payment cancelled for payment ${payment.id}`,
        changes: {
          stripePaymentIntentId: paymentIntentId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling payment intent canceled: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle customer.subscription.created event
   * New recurring donation subscription started
   */
  private async handleSubscriptionCreated(
    subscription: any,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const customerId = subscription.customer as string;

      this.logger.log(`Subscription created: ${subscriptionId}`);

      // Find user by Stripe customer ID
      const user = await this.prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        this.logger.warn(
          `User not found for Stripe customer: ${customerId}`,
        );
        return;
      }

      // Create subscription record
      await this.prisma.subscription.upsert({
        where: { stripeSubscriptionId: subscriptionId },
        update: {
          status: SubscriptionStatus.ACTIVE,
          lastWebhookEventId: eventId,
        },
        create: {
          userId: user.id,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          status: SubscriptionStatus.ACTIVE,
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: (subscription.currency || 'usd').toUpperCase(),
          interval: this.mapStripeInterval(
            subscription.items.data[0]?.price?.recurring?.interval,
          ),
          lastWebhookEventId: eventId,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      this.logger.log(`Subscription ${subscriptionId} created in database`);

      this.activityLogger.logAsync({
        userId: user.id,
        action: 'SUBSCRIPTION_CREATED',
        entityType: 'SUBSCRIPTION',
        entityId: subscriptionId,
        description: `Stripe subscription created for user ${user.id}`,
        changes: {
          amount,
          currency,
          interval: this.mapStripeInterval(
            subscription.items.data[0]?.price?.recurring?.interval,
          ),
        },
      });

      // Queue welcome email
      await this.queueSubscriptionWelcomeEmail(user.id);

      // Log analytics event
      await this.logAnalyticsEvent('subscription_created', {
        userId: user.id,
        subscriptionId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling subscription created: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   * Subscription was modified
   */
  private async handleSubscriptionUpdated(
    subscription: any,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      this.logger.log(`Subscription updated: ${subscriptionId}`);

      const dbSubscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!dbSubscription) {
        this.logger.warn(`Subscription not found in database: ${subscriptionId}`);
        return;
      }

      // Update subscription details
      await this.prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          amount: subscription.items.data[0]?.price?.unit_amount || dbSubscription.amount,
          lastWebhookEventId: eventId,
        },
      });

      this.logger.log(`Subscription ${subscriptionId} updated`);

      this.activityLogger.logAsync({
        userId: dbSubscription.userId,
        action: 'SUBSCRIPTION_UPDATED',
        entityType: 'SUBSCRIPTION',
        entityId: dbSubscription.id,
        description: `Stripe subscription updated for subscription ${subscriptionId}`,
        changes: {
          amount: subscription.items.data[0]?.price?.unit_amount || dbSubscription.amount,
        },
      });

      // Log analytics event
      await this.logAnalyticsEvent('subscription_updated', {
        subscriptionId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling subscription updated: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   * Subscription was canceled
   */
  private async handleSubscriptionDeleted(
    subscription: any,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      this.logger.log(`Subscription deleted: ${subscriptionId}`);

      const dbSubscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!dbSubscription) {
        this.logger.warn(`Subscription not found in database: ${subscriptionId}`);
        return;
      }

      // Update subscription status
      await this.prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          lastWebhookEventId: eventId,
          cancelledAt: new Date(),
        },
      });

      this.logger.log(`Subscription ${subscriptionId} marked as cancelled`);

      this.activityLogger.logAsync({
        userId: dbSubscription.userId,
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'SUBSCRIPTION',
        entityId: dbSubscription.id,
        description: `Stripe subscription cancelled for subscription ${subscriptionId}`,
        changes: {
          status: SubscriptionStatus.CANCELLED,
        },
      });

      // Queue cancellation email
      await this.queueSubscriptionCancellationEmail(dbSubscription.userId);

      // Log analytics event
      await this.logAnalyticsEvent('subscription_cancelled', {
        subscriptionId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling subscription deleted: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   * Recurring subscription payment succeeded
   */
  private async handleInvoicePaymentSucceeded(
    invoice: any,
    eventId: string,
  ): Promise<void> {
    try {
      const invoiceId = invoice.id;
      const subscriptionId = invoice.subscription as string;

      this.logger.log(
        `Invoice payment succeeded: ${invoiceId} (subscription: ${subscriptionId})`,
      );

      const subscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Create/update payment record for the subscription charge
      await this.prisma.payment.upsert({
        where: { stripeInvoiceId: invoiceId },
        update: {
          status: PaymentStatus.COMPLETED,
          lastWebhookEventId: eventId,
        },
        create: {
          userId: subscription.userId,
          stripeInvoiceId: invoiceId,
          amount: invoice.amount_paid || 0,
          currency: (invoice.currency || 'usd').toUpperCase(),
          status: PaymentStatus.COMPLETED,
          lastWebhookEventId: eventId,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Invoice ${invoiceId} payment recorded`);

      this.activityLogger.logAsync({
        userId: subscription.userId,
        action: 'SUBSCRIPTION_PAYMENT_COMPLETED',
        entityType: 'PAYMENT',
        entityId: invoiceId,
        description: `Stripe invoice payment succeeded for subscription ${subscriptionId}`,
        changes: {
          subscriptionId,
          amount: invoice.amount_paid || 0,
        },
      });

      // Queue receipt email
      await this.queueInvoiceReceiptEmail(subscription.userId, invoiceId);

      // Log analytics event
      await this.logAnalyticsEvent('subscription_payment_succeeded', {
        subscriptionId,
        invoiceId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling invoice payment succeeded: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle invoice.payment_failed event
   * Recurring subscription payment failed
   */
  private async handleInvoicePaymentFailed(
    invoice: any,
    eventId: string,
  ): Promise<void> {
    try {
      const invoiceId = invoice.id;
      const subscriptionId = invoice.subscription as string;

      this.logger.warn(
        `Invoice payment failed: ${invoiceId} (subscription: ${subscriptionId})`,
      );

      const subscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Create/update payment record for failed charge
      await this.prisma.payment.upsert({
        where: { stripeInvoiceId: invoiceId },
        update: {
          status: PaymentStatus.FAILED,
          lastWebhookEventId: eventId,
        },
        create: {
          userId: subscription.userId,
          stripeInvoiceId: invoiceId,
          amount: invoice.amount_due || 0,
          currency: (invoice.currency || 'usd').toUpperCase(),
          status: PaymentStatus.FAILED,
          lastWebhookEventId: eventId,
          failureReason: 'Payment declined',
        },
      });

      this.logger.log(`Invoice ${invoiceId} payment failure recorded`);

      this.activityLogger.logAsync({
        userId: subscription.userId,
        action: 'SUBSCRIPTION_PAYMENT_FAILED',
        entityType: 'PAYMENT',
        entityId: invoiceId,
        description: `Stripe invoice payment failed for subscription ${subscriptionId}`,
        status: 'FAILED',
        changes: {
          subscriptionId,
          amountDue: invoice.amount_due || 0,
        },
      });

      // Queue retry notification
      await this.queuePaymentFailureEmail(subscription.userId, invoiceId);

      // Log analytics event
      await this.logAnalyticsEvent('subscription_payment_failed', {
        subscriptionId,
        invoiceId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling invoice payment failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle charge.succeeded event
   */
  private async handleChargeSucceeded(
    charge: any,
    eventId: string,
  ): Promise<void> {
    this.logger.debug(`Charge succeeded: ${charge.id}`);
    // Most charge handling is done via payment_intent and invoice events
  }

  /**
   * Handle charge.failed event
   */
  private async handleChargeFailed(charge: any, eventId: string): Promise<void> {
    this.logger.debug(`Charge failed: ${charge.id}`);
    // Most charge handling is done via payment_intent and invoice events
  }

  /**
   * Handle charge.refunded event
   */
  private async handleChargeRefunded(
    charge: any,
    eventId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Charge refunded: ${charge.id}`);

      // Find payment by charge ID
      const payment = await this.prisma.payment.findFirst({
        where: { stripeChargeId: charge.id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for charge: ${charge.id}`);
        return;
      }

      // Update payment status to refunded
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          lastWebhookEventId: eventId,
        },
      });

      this.logger.log(`Payment ${payment.id} marked as refunded`);

      this.activityLogger.logAsync({
        userId: payment.userId ?? undefined,
        action: 'PAYMENT_REFUNDED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        description: `Stripe payment refunded for payment ${payment.id}`,
        changes: {
          stripeChargeId: charge.id,
        },
      });

      // Queue refund confirmation email
      await this.queueRefundEmail(payment.userId || '');

      // Log analytics event
      await this.logAnalyticsEvent('payment_refunded', {
        paymentId: payment.id,
      });
    } catch (error) {
      this.logger.error(
        `Error handling charge refunded: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Handle customer.created event
   */
  private async handleCustomerCreated(
    customer: any,
    eventId: string,
  ): Promise<void> {
    this.logger.debug(`Customer created: ${customer.id}`);
    // Customer creation is typically initiated by the application
  }

  /**
   * Handle customer.deleted event
   */
  private async handleCustomerDeleted(
    customer: any,
    eventId: string,
  ): Promise<void> {
    this.logger.debug(`Customer deleted: ${customer.id}`);
    // Clean up user Stripe customer reference if needed
  }

  /**
   * Map Stripe interval to our subscription interval
   */
  private mapStripeInterval(stripeInterval?: string): string {
    switch (stripeInterval) {
      case 'day':
        return 'DAILY';
      case 'week':
        return 'WEEKLY';
      case 'month':
        return 'MONTHLY';
      case 'year':
        return 'YEARLY';
      default:
        return 'MONTHLY';
    }
  }

  /**
   * Queue confirmation email to be sent
   */
  private async queueConfirmationEmail(
    paymentId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Fetch payment and user details
      const [payment, user] = await Promise.all([
        this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { petition: { select: { title: true } } },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        }),
      ]);

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      if (!payment) {
        this.logger.warn(`Payment ${paymentId} not found`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queuePaymentConfirmation(user.email, user.fullName || 'Donor', {
          amount: payment.amount,
          currency: payment.currency,
          petitionTitle: payment.petition?.title,
          transactionId: payment.stripePaymentIntentId || 'N/A',
          date: payment.createdAt,
        });
      }

      this.logger.debug(`Queued confirmation email for payment ${paymentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue confirmation email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue failure email to be sent
   */
  private async queueFailureEmail(paymentId: string, userId: string): Promise<void> {
    try {
      // Fetch payment and user details
      const [payment, user] = await Promise.all([
        this.prisma.payment.findUnique({
          where: { id: paymentId },
          select: { amount: true, currency: true, failureReason: true },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        }),
      ]);

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      if (!payment) {
        this.logger.warn(`Payment ${paymentId} not found`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queuePaymentFailed(user.email, user.fullName || 'Donor', {
          amount: payment.amount,
          currency: payment.currency,
          reason: payment.failureReason || 'Card declined',
          retryUrl: `${process.env.APP_URL || 'https://liberianvoices.org'}/payments/retry/${paymentId}`,
        });
      }

      this.logger.debug(`Queued failure email for payment ${paymentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue failure email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue subscription welcome email
   */
  private async queueSubscriptionWelcomeEmail(userId: string): Promise<void> {
    try {
      // Fetch user and subscription details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      // Fetch latest subscription for this user
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        this.logger.warn(`No subscription found for user ${userId}`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queueSubscriptionWelcome(user.email, user.fullName || 'Donor', {
          amount: subscription.amount,
          currency: subscription.currency,
          interval: subscription.interval,
          nextBillingDate: subscription.nextBillingDate || new Date(),
        });
      }

      this.logger.debug(`Queued welcome email for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue welcome email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue subscription cancellation email
   */
  private async queueSubscriptionCancellationEmail(userId: string): Promise<void> {
    try {
      // Fetch user and subscription details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      // Fetch most recent (now cancelled) subscription
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: SubscriptionStatus.CANCELLED },
        orderBy: { cancelledAt: 'desc' },
      });

      if (!subscription) {
        this.logger.warn(`No cancelled subscription found for user ${userId}`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queueSubscriptionCancellation(
          user.email,
          user.fullName || 'Donor',
          {
            amount: subscription.amount,
            currency: subscription.currency,
            interval: subscription.interval,
          },
        );
      }

      this.logger.debug(`Queued cancellation email for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue cancellation email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue invoice receipt email
   */
  private async queueInvoiceReceiptEmail(
    userId: string,
    invoiceId: string,
  ): Promise<void> {
    try {
      // Fetch user and payment details
      const [user, payment] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        }),
        this.prisma.payment.findUnique({
          where: { stripeInvoiceId: invoiceId },
          select: { amount: true, currency: true, createdAt: true },
        }),
      ]);

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      if (!payment) {
        this.logger.warn(`Payment for invoice ${invoiceId} not found`);
        return;
      }

      // Fetch subscription for more context
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queueSubscriptionReceipt(user.email, user.fullName || 'Donor', {
          amount: payment.amount,
          currency: payment.currency,
          interval: subscription?.interval || 'monthly',
        });
      }

      this.logger.debug(`Queued receipt email for invoice ${invoiceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue receipt email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue payment failure email
   */
  private async queuePaymentFailureEmail(
    userId: string,
    invoiceId: string,
  ): Promise<void> {
    try {
      // Fetch user and payment details
      const [user, payment] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        }),
        this.prisma.payment.findUnique({
          where: { stripeInvoiceId: invoiceId },
          select: { amount: true, currency: true, failureReason: true },
        }),
      ]);

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      if (!payment) {
        this.logger.warn(`Payment for invoice ${invoiceId} not found`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queuePaymentFailed(user.email, user.fullName || 'Donor', {
          amount: payment.amount,
          currency: payment.currency,
          reason: payment.failureReason || 'Card declined',
          retryUrl: `${process.env.APP_URL || 'https://liberianvoices.org'}/subscriptions/retry/${userId}`,
        });
      }

      this.logger.debug(`Queued failure email for invoice ${invoiceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue failure email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Queue refund email
   */
  private async queueRefundEmail(userId: string): Promise<void> {
    try {
      // Fetch user and most recent refunded payment
      const [user, payment] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        }),
        this.prisma.payment.findFirst({
          where: { userId, status: PaymentStatus.COMPLETED },
          orderBy: { updatedAt: 'desc' },
          select: { id: true, amount: true, currency: true, stripeChargeId: true },
        }),
      ]);

      if (!user?.email) {
        this.logger.warn(`User ${userId} has no email address`);
        return;
      }

      if (!payment) {
        this.logger.warn(`No refunded payment found for user ${userId}`);
        return;
      }

      // Queue email
      if (this.emailQueue) {
        await this.emailQueue.queueRefund(user.email, user.fullName || 'Donor', {
          amount: payment.amount,
          currency: payment.currency,
          reason: 'Refund processed',
          originalTransactionId: payment.stripeChargeId || payment.id,
        });
      }

      this.logger.debug(`Queued refund email for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue refund email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Don't throw - email failure shouldn't fail webhook processing
    }
  }

  /**
   * Log analytics event
   */
  private async logAnalyticsEvent(
    eventName: string,
    properties: Record<string, any>,
  ): Promise<void> {
    // TODO: Implement analytics integration
    this.logger.debug(`Analytics event: ${eventName}`, properties);
  }

  /**
   * Update petition signature count
   */
  private async updatePetitionSignatureCount(petitionId: string): Promise<void> {
    // TODO: Implement petition signature count update
    this.logger.debug(`Updated signature count for petition ${petitionId}`);
  }
}
