import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../email/email-queue.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import {
  StripeEventType,
  PaymentStatus,
  SubscriptionStatus,
} from './payments.constants';
import {
  StripeEvent,
  StripePaymentIntent,
  StripeInvoice,
  StripeSubscription,
  StripeCharge,
  StripeCustomer,
} from '../config/stripe.config';
import {
  activateMembershipSubscription,
  cancelMembershipSubscriptionByProviderSubscriptionId,
  markMembershipPastDue,
} from '../memberships/membership-webhook.util';
import {
  activateOrganizationSubscription,
  activateInstitutionSubscription,
  cancelOrganizationSubscriptionByProviderSubscriptionId,
  cancelInstitutionSubscriptionByProviderSubscriptionId,
  markOrganizationPastDue,
  markInstitutionPastDue,
} from '../organizations/workspace-webhook.util';
import {
  activatePetitionPromotion,
  failPetitionPromotionByProviderPaymentIntentId,
  activateSponsorshipPurchase,
  failSponsorshipPurchaseByProviderPaymentIntentId,
  activateResearchProductPurchase,
  failResearchProductPurchaseByProviderPaymentIntentId,
  activateEventRegistration,
  failEventRegistrationByProviderPaymentIntentId,
  activateInvoicePayment,
  failInvoicePaymentByProviderPaymentIntentId,
  activateApiSubscription,
  cancelApiSubscriptionByProviderSubscriptionId,
  markApiSubscriptionPastDue,
} from '../monetization/monetization-webhook.util';

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
    private readonly entitlementsService: EntitlementsService,
    @Optional() private readonly emailQueue: EmailQueueService | null,
  ) {}

  /**
   * Route webhook event to appropriate handler based on event type
   */
  async handleWebhookEvent(event: StripeEvent): Promise<void> {
    this.logger.debug(`Processing webhook event: ${event.type} (${event.id})`);

    switch (event.type as StripeEventType) {
      // Payment Intent Events
      case StripeEventType.PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentIntentSucceeded(
          event.data.object as StripePaymentIntent,
          event.id,
        );
        break;

      case StripeEventType.PAYMENT_INTENT_PAYMENT_FAILED:
        await this.handlePaymentIntentFailed(
          event.data.object as StripePaymentIntent,
          event.id,
        );
        break;

      case StripeEventType.PAYMENT_INTENT_CANCELED:
        await this.handlePaymentIntentCanceled(
          event.data.object as StripePaymentIntent,
          event.id,
        );
        break;

      // Subscription Events
      case StripeEventType.CUSTOMER_SUBSCRIPTION_CREATED:
        await this.handleSubscriptionCreated(
          event.data.object as StripeSubscription,
          event.id,
        );
        break;

      case StripeEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.handleSubscriptionUpdated(
          event.data.object as StripeSubscription,
          event.id,
        );
        break;

      case StripeEventType.CUSTOMER_SUBSCRIPTION_DELETED:
        await this.handleSubscriptionDeleted(
          event.data.object as StripeSubscription,
          event.id,
        );
        break;

      // Invoice Events
      case StripeEventType.INVOICE_PAYMENT_SUCCEEDED:
        await this.handleInvoicePaymentSucceeded(
          event.data.object as StripeInvoice,
          event.id,
        );
        break;

      case StripeEventType.INVOICE_PAYMENT_FAILED:
        await this.handleInvoicePaymentFailed(
          event.data.object as StripeInvoice,
          event.id,
        );
        break;

      // Charge Events
      case StripeEventType.CHARGE_SUCCEEDED:
        this.handleChargeSucceeded(event.data.object as StripeCharge);
        break;

      case StripeEventType.CHARGE_FAILED:
        this.handleChargeFailed(event.data.object as StripeCharge);
        break;

      case StripeEventType.CHARGE_REFUNDED:
        await this.handleChargeRefunded(
          event.data.object as StripeCharge,
          event.id,
        );
        break;

      // Customer Events
      case StripeEventType.CUSTOMER_CREATED:
        this.handleCustomerCreated(event.data.object as StripeCustomer);
        break;

      case StripeEventType.CUSTOMER_DELETED:
        this.handleCustomerDeleted(event.data.object as StripeCustomer);
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
    paymentIntent: StripePaymentIntent,
    eventId: string,
  ): Promise<void> {
    try {
      const paymentIntentId = paymentIntent.id;
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;

      this.logger.log(
        `Payment intent succeeded: ${paymentIntentId} (${amount} ${currency})`,
      );

      // Milestone 10 one-time purchases (Promotion/Sponsorship/Research/
      // Event) tag the resulting PaymentIntent via payment_intent_data.metadata
      // on the Checkout Session (see the fix in stripe-provider.adapter.ts
      // this milestone) — checked before the generic Payment-table lookup,
      // same early-return pattern as the subscription-metadata dispatch in
      // handleSubscriptionCreated below.
      if (
        await this.handleMonetizationPurchaseSucceeded(paymentIntent, eventId)
      ) {
        return;
      }

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
          stripeChargeId:
            (typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge?.id) || null,
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
        this.updatePetitionSignatureCount(payment.petitionId);
      }

      // Queue confirmation email
      if (payment.userId) {
        await this.queueConfirmationEmail(payment.id, payment.userId);
      }

      // Log analytics event
      this.logAnalyticsEvent('payment_completed', {
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
    paymentIntent: StripePaymentIntent,
    eventId: string,
  ): Promise<void> {
    try {
      const paymentIntentId = paymentIntent.id;
      const lastPaymentError = paymentIntent.last_payment_error;

      this.logger.warn(
        `Payment intent failed: ${paymentIntentId} - ${lastPaymentError?.message}`,
      );

      if (
        await this.handleMonetizationPurchaseFailed(paymentIntentId, eventId)
      ) {
        return;
      }

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
      this.logAnalyticsEvent('payment_failed', {
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
    paymentIntent: StripePaymentIntent,
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
    subscription: StripeSubscription,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const customerId = subscription.customer as string;
      const subscriptionPeriodStart =
        subscription.items.data[0]?.current_period_start;
      const subscriptionPeriodEnd =
        subscription.items.data[0]?.current_period_end;

      this.logger.log(`Subscription created: ${subscriptionId}`);

      // Membership checkout sessions tag the resulting Subscription with
      // this metadata key (see StripeProviderAdapter.createCheckoutSession
      // and MembershipsService.subscribe) — when present, this event
      // belongs to a MembershipSubscription, not the generic donation
      // Subscription model below, so activate it and stop here.
      const membershipSubscriptionId =
        subscription.metadata?.membershipSubscriptionId;
      if (membershipSubscriptionId) {
        await activateMembershipSubscription(
          this.prisma,
          this.entitlementsService,
          membershipSubscriptionId,
          {
            providerSubscriptionId: subscriptionId,
            providerCustomerId: customerId,
            currentPeriodStart: subscriptionPeriodStart
              ? new Date(subscriptionPeriodStart * 1000)
              : null,
            currentPeriodEnd: subscriptionPeriodEnd
              ? new Date(subscriptionPeriodEnd * 1000)
              : null,
            eventId,
          },
        );
        this.logger.log(
          `Membership subscription ${membershipSubscriptionId} activated (${subscriptionId})`,
        );
        return;
      }

      // Same disambiguation for Organization- and Institution-scoped
      // workspace subscriptions (Milestone 9) — see
      // OrganizationsService.subscribe / InstitutionSubscriptionsService.subscribe.
      const organizationSubscriptionId =
        subscription.metadata?.organizationSubscriptionId;
      if (organizationSubscriptionId) {
        await activateOrganizationSubscription(
          this.prisma,
          this.entitlementsService,
          organizationSubscriptionId,
          {
            providerSubscriptionId: subscriptionId,
            providerCustomerId: customerId,
            currentPeriodStart: subscriptionPeriodStart
              ? new Date(subscriptionPeriodStart * 1000)
              : null,
            currentPeriodEnd: subscriptionPeriodEnd
              ? new Date(subscriptionPeriodEnd * 1000)
              : null,
            eventId,
          },
        );
        this.logger.log(
          `Organization subscription ${organizationSubscriptionId} activated (${subscriptionId})`,
        );
        return;
      }

      const institutionSubscriptionId =
        subscription.metadata?.institutionSubscriptionId;
      if (institutionSubscriptionId) {
        await activateInstitutionSubscription(
          this.prisma,
          this.entitlementsService,
          institutionSubscriptionId,
          {
            providerSubscriptionId: subscriptionId,
            providerCustomerId: customerId,
            currentPeriodStart: subscriptionPeriodStart
              ? new Date(subscriptionPeriodStart * 1000)
              : null,
            currentPeriodEnd: subscriptionPeriodEnd
              ? new Date(subscriptionPeriodEnd * 1000)
              : null,
            eventId,
          },
        );
        this.logger.log(
          `Institution subscription ${institutionSubscriptionId} activated (${subscriptionId})`,
        );
        return;
      }

      const apiSubscriptionId = subscription.metadata?.apiSubscriptionId;
      if (apiSubscriptionId) {
        await activateApiSubscription(
          this.prisma,
          this.entitlementsService,
          apiSubscriptionId,
          {
            providerSubscriptionId: subscriptionId,
            providerCustomerId: customerId,
            currentPeriodStart: subscriptionPeriodStart
              ? new Date(subscriptionPeriodStart * 1000)
              : null,
            currentPeriodEnd: subscriptionPeriodEnd
              ? new Date(subscriptionPeriodEnd * 1000)
              : null,
            eventId,
          },
        );
        this.logger.log(
          `API subscription ${apiSubscriptionId} activated (${subscriptionId})`,
        );
        return;
      }

      // Find user by Stripe customer ID
      const user = await this.prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        this.logger.warn(`User not found for Stripe customer: ${customerId}`);
        return;
      }

      // Stripe's price.unit_amount is minor units (cents); this codebase's
      // amount columns are major units (dollars) — see the fix note in
      // handleSubscriptionUpdated below for the full explanation. This
      // create-path had the identical bug: a subscription whose first
      // webhook was customer.subscription.created (rather than one created
      // through PaymentService.createStripeSubscription, which already
      // divides correctly) got its dollar amount stored 100x too large.
      const unitAmountCents = subscription.items.data[0]?.price?.unit_amount;
      const createdAmount =
        typeof unitAmountCents === 'number' ? unitAmountCents / 100 : 0;

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
          amount: createdAmount,
          amountDecimal: new Prisma.Decimal(createdAmount),
          currency: (subscription.currency || 'usd').toUpperCase(),
          interval: this.mapStripeInterval(
            subscription.items.data[0]?.price?.recurring?.interval,
          ),
          lastWebhookEventId: eventId,
          currentPeriodStart: subscriptionPeriodStart
            ? new Date(subscriptionPeriodStart * 1000)
            : new Date(),
          currentPeriodEnd: subscriptionPeriodEnd
            ? new Date(subscriptionPeriodEnd * 1000)
            : new Date(),
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
          amount: createdAmount,
          currency: (subscription.currency || 'usd').toUpperCase(),
          interval: this.mapStripeInterval(
            subscription.items.data[0]?.price?.recurring?.interval,
          ),
        },
      });

      // Queue welcome email
      await this.queueSubscriptionWelcomeEmail(user.id);

      // Log analytics event
      this.logAnalyticsEvent('subscription_created', {
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
    subscription: StripeSubscription,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      this.logger.log(`Subscription updated: ${subscriptionId}`);

      const dbSubscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!dbSubscription) {
        const handled =
          (await this.handleMembershipSubscriptionUpdated(
            subscriptionId,
            subscription.status,
            eventId,
          )) ||
          (await this.handleOrganizationSubscriptionUpdated(
            subscriptionId,
            subscription.status,
            eventId,
          )) ||
          (await this.handleInstitutionSubscriptionUpdated(
            subscriptionId,
            subscription.status,
            eventId,
          )) ||
          (await this.handleApiSubscriptionUpdated(
            subscriptionId,
            subscription.status,
            eventId,
          ));
        if (!handled) {
          this.logger.warn(
            `Subscription not found in database: ${subscriptionId}`,
          );
        }
        return;
      }

      // Stripe's price.unit_amount is in minor units (cents); every amount
      // column in this codebase stores major units (dollars) — confirmed
      // against payment.service.spec.ts's own fixtures. Fixed here: this
      // previously wrote the raw cents value straight into `amount`,
      // inflating a subscription's stored dollar amount 100x whenever
      // Stripe sent a price change on this webhook.
      const unitAmountCents = subscription.items.data[0]?.price?.unit_amount;
      const updatedAmount =
        typeof unitAmountCents === 'number'
          ? unitAmountCents / 100
          : dbSubscription.amount;

      // Update subscription details
      await this.prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          amount: updatedAmount,
          amountDecimal: new Prisma.Decimal(updatedAmount),
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
          amount: updatedAmount,
        },
      });

      // Log analytics event
      this.logAnalyticsEvent('subscription_updated', {
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
    subscription: StripeSubscription,
    eventId: string,
  ): Promise<void> {
    try {
      const subscriptionId = subscription.id;

      this.logger.log(`Subscription deleted: ${subscriptionId}`);

      const dbSubscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!dbSubscription) {
        const membershipSubscription =
          await cancelMembershipSubscriptionByProviderSubscriptionId(
            this.prisma,
            this.entitlementsService,
            subscriptionId,
            eventId,
          );
        if (membershipSubscription) {
          this.logger.log(
            `Membership subscription ${membershipSubscription.id} cancelled (${subscriptionId})`,
          );
          return;
        }

        const organizationSubscription =
          await cancelOrganizationSubscriptionByProviderSubscriptionId(
            this.prisma,
            this.entitlementsService,
            subscriptionId,
            eventId,
          );
        if (organizationSubscription) {
          this.logger.log(
            `Organization subscription ${organizationSubscription.id} cancelled (${subscriptionId})`,
          );
          return;
        }

        const institutionSubscription =
          await cancelInstitutionSubscriptionByProviderSubscriptionId(
            this.prisma,
            this.entitlementsService,
            subscriptionId,
            eventId,
          );
        if (institutionSubscription) {
          this.logger.log(
            `Institution subscription ${institutionSubscription.id} cancelled (${subscriptionId})`,
          );
          return;
        }

        const apiSubscription =
          await cancelApiSubscriptionByProviderSubscriptionId(
            this.prisma,
            this.entitlementsService,
            subscriptionId,
            eventId,
          );
        if (apiSubscription) {
          this.logger.log(
            `API subscription ${apiSubscription.id} cancelled (${subscriptionId})`,
          );
          return;
        }

        this.logger.warn(
          `Subscription not found in database: ${subscriptionId}`,
        );
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
      this.logAnalyticsEvent('subscription_cancelled', {
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
    invoice: StripeInvoice,
    eventId: string,
  ): Promise<void> {
    try {
      const invoiceId = invoice.id;
      const rawSubscription =
        invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof rawSubscription === 'string'
          ? rawSubscription
          : rawSubscription?.id;

      this.logger.log(
        `Invoice payment succeeded: ${invoiceId} (subscription: ${subscriptionId})`,
      );

      if (!subscriptionId) {
        this.logger.warn(`Invoice ${invoiceId} has no associated subscription`);
        return;
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Stripe's invoice.amount_paid is minor units (cents); dollars here,
      // same fix as handleSubscriptionCreated/Updated above.
      const paidAmount = (invoice.amount_paid || 0) / 100;

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
          amount: paidAmount,
          amountDecimal: new Prisma.Decimal(paidAmount),
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
          amount: paidAmount,
        },
      });

      // Queue receipt email
      await this.queueInvoiceReceiptEmail(subscription.userId, invoiceId);

      // Log analytics event
      this.logAnalyticsEvent('subscription_payment_succeeded', {
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
    invoice: StripeInvoice,
    eventId: string,
  ): Promise<void> {
    try {
      const invoiceId = invoice.id;
      const rawSubscription =
        invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof rawSubscription === 'string'
          ? rawSubscription
          : rawSubscription?.id;

      this.logger.warn(
        `Invoice payment failed: ${invoiceId} (subscription: ${subscriptionId})`,
      );

      if (!subscriptionId) {
        this.logger.warn(`Invoice ${invoiceId} has no associated subscription`);
        return;
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!subscription) {
        // Each mark*PastDue call is a no-op updateMany for tables with no
        // matching row, so firing all four unconditionally is simpler and
        // just as correct as a find-first lookup chain here.
        await markMembershipPastDue(this.prisma, subscriptionId, eventId);
        await markOrganizationPastDue(this.prisma, subscriptionId, eventId);
        await markInstitutionPastDue(this.prisma, subscriptionId, eventId);
        await markApiSubscriptionPastDue(this.prisma, subscriptionId, eventId);
        this.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
      }

      // Stripe's invoice.amount_due is minor units (cents); dollars here,
      // same fix as the other Stripe amount fields in this file.
      const dueAmount = (invoice.amount_due || 0) / 100;

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
          amount: dueAmount,
          amountDecimal: new Prisma.Decimal(dueAmount),
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
          amountDue: dueAmount,
        },
      });

      // Queue retry notification
      await this.queuePaymentFailureEmail(subscription.userId, invoiceId);

      // Log analytics event
      this.logAnalyticsEvent('subscription_payment_failed', {
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
  private handleChargeSucceeded(charge: StripeCharge): void {
    this.logger.debug(`Charge succeeded: ${charge.id}`);
    // Most charge handling is done via payment_intent and invoice events
  }

  /**
   * Handle charge.failed event
   */
  private handleChargeFailed(charge: StripeCharge): void {
    this.logger.debug(`Charge failed: ${charge.id}`);
    // Most charge handling is done via payment_intent and invoice events
  }

  /**
   * Handle charge.refunded event
   */
  private async handleChargeRefunded(
    charge: StripeCharge,
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
          status: PaymentStatus.REFUNDED,
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
      this.logAnalyticsEvent('payment_refunded', {
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
  private handleCustomerCreated(customer: StripeCustomer): void {
    this.logger.debug(`Customer created: ${customer.id}`);
    // Customer creation is typically initiated by the application
  }

  /**
   * Handle customer.deleted event
   */
  private handleCustomerDeleted(customer: StripeCustomer): void {
    this.logger.debug(`Customer deleted: ${customer.id}`);
    // Clean up user Stripe customer reference if needed
  }

  /**
   * Fallbacks for customer.subscription.updated when no generic (donation)
   * Subscription row matches — checked in order: MembershipSubscription,
   * then OrganizationSubscription, then InstitutionSubscription. Every one
   * of these plan types has a fixed price (no amount to reconcile here), so
   * the only thing worth tracking off this event is status: Stripe moving a
   * subscription to past_due/unpaid, or recovering it back to active.
   * Entitlements are only granted/revoked on activation/cancellation, not
   * on every status wobble, so none of these touch EntitlementGrant.
   * Each returns false (rather than logging) when its table has no match,
   * so the caller can try the next one and only warn once all three miss.
   */
  private async handleMembershipSubscriptionUpdated(
    providerSubscriptionId: string,
    stripeStatus: string,
    eventId: string,
  ): Promise<boolean> {
    const membershipSubscription =
      await this.prisma.membershipSubscription.findUnique({
        where: { providerSubscriptionId },
      });
    if (!membershipSubscription) return false;

    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      await markMembershipPastDue(this.prisma, providerSubscriptionId, eventId);
    } else if (stripeStatus === 'active') {
      await this.prisma.membershipSubscription.update({
        where: { id: membershipSubscription.id },
        data: { status: 'ACTIVE', lastWebhookEventId: eventId },
      });
    } else {
      await this.prisma.membershipSubscription.update({
        where: { id: membershipSubscription.id },
        data: { lastWebhookEventId: eventId },
      });
    }

    this.logger.log(
      `Membership subscription ${membershipSubscription.id} updated (Stripe status: ${stripeStatus})`,
    );
    return true;
  }

  private async handleOrganizationSubscriptionUpdated(
    providerSubscriptionId: string,
    stripeStatus: string,
    eventId: string,
  ): Promise<boolean> {
    const organizationSubscription =
      await this.prisma.organizationSubscription.findUnique({
        where: { providerSubscriptionId },
      });
    if (!organizationSubscription) return false;

    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      await markOrganizationPastDue(
        this.prisma,
        providerSubscriptionId,
        eventId,
      );
    } else if (stripeStatus === 'active') {
      await this.prisma.organizationSubscription.update({
        where: { id: organizationSubscription.id },
        data: { status: 'ACTIVE', lastWebhookEventId: eventId },
      });
    } else {
      await this.prisma.organizationSubscription.update({
        where: { id: organizationSubscription.id },
        data: { lastWebhookEventId: eventId },
      });
    }

    this.logger.log(
      `Organization subscription ${organizationSubscription.id} updated (Stripe status: ${stripeStatus})`,
    );
    return true;
  }

  private async handleInstitutionSubscriptionUpdated(
    providerSubscriptionId: string,
    stripeStatus: string,
    eventId: string,
  ): Promise<boolean> {
    const institutionSubscription =
      await this.prisma.institutionSubscription.findUnique({
        where: { providerSubscriptionId },
      });
    if (!institutionSubscription) return false;

    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      await markInstitutionPastDue(
        this.prisma,
        providerSubscriptionId,
        eventId,
      );
    } else if (stripeStatus === 'active') {
      await this.prisma.institutionSubscription.update({
        where: { id: institutionSubscription.id },
        data: { status: 'ACTIVE', lastWebhookEventId: eventId },
      });
    } else {
      await this.prisma.institutionSubscription.update({
        where: { id: institutionSubscription.id },
        data: { lastWebhookEventId: eventId },
      });
    }

    this.logger.log(
      `Institution subscription ${institutionSubscription.id} updated (Stripe status: ${stripeStatus})`,
    );
    return true;
  }

  private async handleApiSubscriptionUpdated(
    providerSubscriptionId: string,
    stripeStatus: string,
    eventId: string,
  ): Promise<boolean> {
    const apiSubscription = await this.prisma.apiSubscription.findUnique({
      where: { providerSubscriptionId },
    });
    if (!apiSubscription) return false;

    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      await markApiSubscriptionPastDue(
        this.prisma,
        providerSubscriptionId,
        eventId,
      );
    } else if (stripeStatus === 'active') {
      await this.prisma.apiSubscription.update({
        where: { id: apiSubscription.id },
        data: { status: 'ACTIVE', lastWebhookEventId: eventId },
      });
    } else {
      await this.prisma.apiSubscription.update({
        where: { id: apiSubscription.id },
        data: { lastWebhookEventId: eventId },
      });
    }

    this.logger.log(
      `API subscription ${apiSubscription.id} updated (Stripe status: ${stripeStatus})`,
    );
    return true;
  }

  /**
   * Milestone 10 dispatch for `payment_intent.succeeded` — tries each
   * one-time-purchase metadata key in turn, same fallback-chain pattern as
   * the subscription updaters above. Returns false (never logs) when none
   * match, so the caller falls through to the generic Payment lookup.
   */
  private async handleMonetizationPurchaseSucceeded(
    paymentIntent: StripePaymentIntent,
    eventId: string,
  ): Promise<boolean> {
    const paymentIntentId = paymentIntent.id;
    const metadata = paymentIntent.metadata ?? {};

    if (metadata.promotionId) {
      const promotion = await activatePetitionPromotion(
        this.prisma,
        metadata.promotionId,
        {
          providerPaymentIntentId: paymentIntentId,
          eventId,
        },
      );
      this.logger.log(
        `Petition promotion ${promotion.id} activated (${paymentIntentId})`,
      );
      return true;
    }
    if (metadata.sponsorshipPurchaseId) {
      const purchase = await activateSponsorshipPurchase(
        this.prisma,
        metadata.sponsorshipPurchaseId,
        { providerPaymentIntentId: paymentIntentId, eventId },
      );
      this.logger.log(
        `Sponsorship purchase ${purchase.id} activated (${paymentIntentId})`,
      );
      return true;
    }
    if (metadata.researchProductPurchaseId) {
      const purchase = await activateResearchProductPurchase(
        this.prisma,
        metadata.researchProductPurchaseId,
        { providerPaymentIntentId: paymentIntentId, eventId },
      );
      this.logger.log(
        `Research product purchase ${purchase.id} activated (${paymentIntentId})`,
      );
      return true;
    }
    if (metadata.eventRegistrationId) {
      const registration = await activateEventRegistration(
        this.prisma,
        metadata.eventRegistrationId,
        { providerPaymentIntentId: paymentIntentId, eventId },
      );
      this.logger.log(
        `Event registration ${registration.id} activated (${paymentIntentId})`,
      );
      return true;
    }
    if (metadata.invoiceId) {
      const invoice = await activateInvoicePayment(
        this.prisma,
        metadata.invoiceId,
        { providerPaymentIntentId: paymentIntentId, eventId },
      );
      this.logger.log(`Invoice ${invoice.number} paid (${paymentIntentId})`);
      return true;
    }
    return false;
  }

  /** Failure-path counterpart to handleMonetizationPurchaseSucceeded above. */
  private async handleMonetizationPurchaseFailed(
    paymentIntentId: string,
    eventId: string,
  ): Promise<boolean> {
    const promotion = await failPetitionPromotionByProviderPaymentIntentId(
      this.prisma,
      paymentIntentId,
      eventId,
    );
    if (promotion) {
      this.logger.warn(
        `Petition promotion ${promotion.id} payment failed (${paymentIntentId})`,
      );
      return true;
    }
    const sponsorship = await failSponsorshipPurchaseByProviderPaymentIntentId(
      this.prisma,
      paymentIntentId,
      eventId,
    );
    if (sponsorship) {
      this.logger.warn(
        `Sponsorship purchase ${sponsorship.id} payment failed (${paymentIntentId})`,
      );
      return true;
    }
    const research = await failResearchProductPurchaseByProviderPaymentIntentId(
      this.prisma,
      paymentIntentId,
      eventId,
    );
    if (research) {
      this.logger.warn(
        `Research product purchase ${research.id} payment failed (${paymentIntentId})`,
      );
      return true;
    }
    const registration = await failEventRegistrationByProviderPaymentIntentId(
      this.prisma,
      paymentIntentId,
      eventId,
    );
    if (registration) {
      this.logger.warn(
        `Event registration ${registration.id} payment failed (${paymentIntentId})`,
      );
      return true;
    }
    const invoice = await failInvoicePaymentByProviderPaymentIntentId(
      this.prisma,
      paymentIntentId,
      eventId,
    );
    if (invoice) {
      this.logger.warn(
        `Invoice ${invoice.number} payment failed (${paymentIntentId})`,
      );
      return true;
    }
    return false;
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
        await this.emailQueue.queuePaymentConfirmation(
          user.email,
          user.fullName || 'Donor',
          {
            amount: payment.amount,
            currency: payment.currency,
            petitionTitle: payment.petition?.title,
            transactionId: payment.stripePaymentIntentId || 'N/A',
            date: payment.createdAt,
          },
        );
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
  private async queueFailureEmail(
    paymentId: string,
    userId: string,
  ): Promise<void> {
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
        await this.emailQueue.queuePaymentFailed(
          user.email,
          user.fullName || 'Donor',
          {
            amount: payment.amount,
            currency: payment.currency,
            reason: payment.failureReason || 'Card declined',
            retryUrl: `${process.env.APP_URL || 'https://liberianvoices.org'}/payments/retry/${paymentId}`,
          },
        );
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
        await this.emailQueue.queueSubscriptionWelcome(
          user.email,
          user.fullName || 'Donor',
          {
            amount: subscription.amount,
            currency: subscription.currency,
            interval: subscription.interval,
            nextBillingDate: subscription.nextBillingDate || new Date(),
          },
        );
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
  private async queueSubscriptionCancellationEmail(
    userId: string,
  ): Promise<void> {
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
        await this.emailQueue.queueSubscriptionReceipt(
          user.email,
          user.fullName || 'Donor',
          {
            amount: payment.amount,
            currency: payment.currency,
            interval: subscription?.interval || 'monthly',
          },
        );
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
        await this.emailQueue.queuePaymentFailed(
          user.email,
          user.fullName || 'Donor',
          {
            amount: payment.amount,
            currency: payment.currency,
            reason: payment.failureReason || 'Card declined',
            retryUrl: `${process.env.APP_URL || 'https://liberianvoices.org'}/subscriptions/retry/${userId}`,
          },
        );
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
          select: {
            id: true,
            amount: true,
            currency: true,
            stripeChargeId: true,
          },
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
        await this.emailQueue.queueRefund(
          user.email,
          user.fullName || 'Donor',
          {
            amount: payment.amount,
            currency: payment.currency,
            reason: 'Refund processed',
            originalTransactionId: payment.stripeChargeId || payment.id,
          },
        );
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
  private logAnalyticsEvent(
    eventName: string,
    properties: Record<string, any>,
  ): void {
    // TODO: Implement analytics integration
    this.logger.debug(`Analytics event: ${eventName}`, properties);
  }

  /**
   * Update petition signature count
   */
  private updatePetitionSignatureCount(petitionId: string): void {
    // TODO: Implement petition signature count update
    this.logger.debug(`Updated signature count for petition ${petitionId}`);
  }
}
