import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { Payment, Subscription, PaymentStatus, SubscriptionStatus } from '@prisma/client';

export interface CreatePaymentIntentDto {
  petitionId?: string;
  userId?: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionDto extends CreatePaymentIntentDto {
  recurringInterval: 'monthly' | 'quarterly' | 'yearly';
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutSessionResponse {
  id: string;
  url: string;
  amountTotal: number;
  currency: string;
  status: string;
}

export interface SubscriptionResponse {
  id: string;
  petitionId: string | null;
  userId: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  nextBillingDate: Date | null;
  createdAt: Date;
  canceledAt?: Date | null;
}

export interface RefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: Date;
}

export interface PaymentHistoryResponse {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  method?: {
    id: string;
    type: string;
    brand?: string | null;
    lastFourDigits?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PaymentService {
  private stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.STRIPE_API_KEY || '';
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20' as any,
    });
  }

  /**
   * Create a payment intent for one-time donation
   */
  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponse> {
    try {
      if (dto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Verify petition exists if provided
      if (dto.petitionId) {
        const petition = await this.prisma.petition.findUnique({
          where: { id: dto.petitionId },
        });
        if (!petition) {
          throw new BadRequestException('Petition not found');
        }
      }

      const amountInCents = Math.round(dto.amount * 100);

      const intent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: dto.currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          petitionId: dto.petitionId || '',
          userId: dto.userId || '',
          donorEmail: dto.donorEmail,
          ...dto.metadata,
        },
        receipt_email: dto.donorEmail,
      });

      // Store payment in database
      await this.prisma.payment.create({
        data: {
          userId: dto.userId,
          petitionId: dto.petitionId,
          amount: dto.amount,
          currency: dto.currency,
          status: 'PENDING' as PaymentStatus,
          stripePaymentIntentId: intent.id,
          description: `Donation${dto.petitionId ? ` to petition` : ''}`,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
        },
      });

      return {
        id: intent.id,
        clientSecret: intent.client_secret || '',
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw error;
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(
    intentId: string,
    paymentMethodId: string,
  ): Promise<PaymentHistoryResponse> {
    try {
      // Confirm the intent with Stripe
      const intent = await this.stripe.paymentIntents.confirm(intentId, {
        payment_method: paymentMethodId,
      });

      if (intent.status !== 'succeeded') {
        throw new BadRequestException(
          `Payment failed with status: ${intent.status}`,
        );
      }

      // Find the payment record
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: intentId },
      });

      if (!payment) {
        throw new BadRequestException('Payment record not found');
      }

      // Update payment status
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED' as PaymentStatus,
          completedAt: new Date(),
        },
      });

      // Store payment method
      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        paymentMethodId,
      );

      if (payment.userId) {
        await this.prisma.paymentMethodRecord.create({
          data: {
            userId: payment.userId,
            type: 'CARD',
            stripeMethodId: paymentMethodId,
            brand: (paymentMethod.card?.brand as string) || undefined,
            lastFourDigits: paymentMethod.card?.last4 || undefined,
            expiryMonth: paymentMethod.card?.exp_month || undefined,
            expiryYear: paymentMethod.card?.exp_year || undefined,
            isDefault: false,
          },
        });
      }

      return this.formatPaymentHistory(updated);
    } catch (error) {
      this.logger.error('Failed to confirm payment', error);
      throw error;
    }
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(
    dto: CreatePaymentIntentDto & { recurringInterval?: string },
  ): Promise<CheckoutSessionResponse> {
    try {
      if (dto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      let petitionName = 'Donation';
      if (dto.petitionId) {
        const petition = await this.prisma.petition.findUnique({
          where: { id: dto.petitionId },
        });
        if (!petition) {
          throw new BadRequestException('Petition not found');
        }
        petitionName = petition.title;
      }

      const mode = dto.recurringInterval ? 'subscription' : 'payment';

      // Map our interval values to Stripe values (month/year only)
      const stripeInterval = (
        dto.recurringInterval === 'quarterly'
          ? 'month'
          : dto.recurringInterval === 'monthly'
            ? 'month'
            : 'year'
      ) as 'month' | 'year' | 'week';

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode,
        line_items: [
          {
            price_data: {
              currency: dto.currency.toLowerCase(),
              unit_amount: Math.round(dto.amount * 100),
              product_data: {
                name: petitionName,
              },
              ...(dto.recurringInterval && {
                recurring: {
                  interval: stripeInterval,
                  interval_count: 1,
                },
              }),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.APP_URL}/donations/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/petitions/${dto.petitionId || ''}`,
        customer_email: dto.donorEmail,
        metadata: {
          petitionId: dto.petitionId || '',
          userId: dto.userId || '',
        },
      });

      // Store checkout session as payment
      await this.prisma.payment.create({
        data: {
          userId: dto.userId,
          petitionId: dto.petitionId,
          amount: dto.amount,
          currency: dto.currency,
          status: 'PENDING' as PaymentStatus,
          stripeCheckoutId: session.id,
          description: `Checkout session for ${petitionName}`,
        },
      });

      return {
        id: session.id,
        url: session.url || '',
        amountTotal: session.amount_total || 0,
        currency: session.currency || dto.currency,
        status: session.payment_status || 'unpaid',
      };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentHistoryResponse> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      return this.formatPaymentHistory(payment);
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponse> {
    try {
      if (!dto.recurringInterval) {
        throw new BadRequestException('Recurring interval is required');
      }

      if (dto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Verify petition exists if provided
      if (dto.petitionId) {
        const petition = await this.prisma.petition.findUnique({
          where: { id: dto.petitionId },
        });
        if (!petition) {
          throw new BadRequestException('Petition not found');
        }
      }

      if (!dto.userId) {
        throw new BadRequestException('User ID is required for subscriptions');
      }

      // Create Stripe customer
      const customer = await this.stripe.customers.create({
        email: dto.donorEmail,
        name: dto.donorName,
        metadata: {
          userId: dto.userId,
          petitionId: dto.petitionId || '',
        },
      });

      // Create price
      const product = await this.stripe.products.create({
        name: dto.petitionId ? 'Petition Donation' : 'Platform Donation',
        type: 'service',
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(dto.amount * 100),
        currency: dto.currency.toLowerCase(),
        recurring: {
          interval: this.mapInterval(dto.recurringInterval),
          interval_count: 1,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        metadata: {
          petitionId: dto.petitionId || '',
          userId: dto.userId,
        },
      });

      // Store in database
      const stored = await this.prisma.subscription.create({
        data: {
          userId: dto.userId,
          petitionId: dto.petitionId,
          amount: dto.amount,
          currency: dto.currency,
          interval: dto.recurringInterval,
          status: 'ACTIVE' as SubscriptionStatus,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          currentPeriodStart: new Date(
            (subscription as any).current_period_start * 1000,
          ),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          nextBillingDate: new Date(
            (subscription as any).current_period_end * 1000,
          ),
        },
      });

      return this.formatSubscription(stored);
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    amount?: number,
  ): Promise<SubscriptionResponse> {
    try {
      const stored = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!stored) {
        throw new BadRequestException('Subscription not found');
      }

      let updated = stored;

      if (amount && amount !== stored.amount) {
        // Create new price and update
        const product = await this.stripe.products.create({
          name: 'Updated Donation',
          type: 'service',
        });

        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(amount * 100),
          currency: stored.currency.toLowerCase(),
          recurring: {
            interval: this.mapInterval(stored.interval),
            interval_count: 1,
          },
        });

        await this.stripe.subscriptions.update(
          stored.stripeSubscriptionId || '',
          {
            items: [
              {
                id: (await this.stripe.subscriptions.retrieve(
                  stored.stripeSubscriptionId || '',
                )).items.data[0].id,
                price: price.id,
              },
            ] as any,
          } as any,
        );

        updated = await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { amount },
        });
      }

      return this.formatSubscription(updated);
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      const stored = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!stored) {
        throw new BadRequestException('Subscription not found');
      }

      await (this.stripe.subscriptions as any).del(stored.stripeSubscriptionId);

      const updated = await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED' as SubscriptionStatus,
          cancelledAt: new Date(),
        },
      });

      return this.formatSubscription(updated);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw error;
    }
  }

  /**
   * Get user payment history
   */
  async getUserPaymentHistory(userId: string): Promise<PaymentHistoryResponse[]> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return payments.map((p) => this.formatPaymentHistory(p));
    } catch (error) {
      this.logger.error('Failed to get payment history', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refundPayment(
    paymentId: string,
    reason: string,
  ): Promise<RefundResponse> {
    try {
      if (!reason) {
        throw new BadRequestException('Refund reason is required');
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      if (!payment.stripePaymentIntentId) {
        throw new BadRequestException('Cannot refund this payment');
      }

      // Retrieve the charge from the payment intent
      const intent = await this.stripe.paymentIntents.retrieve(
        payment.stripePaymentIntentId,
      );

      const charges = (intent as any).charges?.data || [];
      if (!charges[0]) {
        throw new BadRequestException('No charge found for this payment');
      }

      const chargeId = charges[0].id;

      // Create refund
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer',
      });

      // Store refund in database
      const stored = await this.prisma.refund.create({
        data: {
          paymentId,
          amount: payment.amount,
          currency: payment.currency,
          reason,
          stripeRefundId: refund.id,
          status: refund.status || 'pending',
        },
      });

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'CANCELLED' as PaymentStatus },
      });

      return {
        refundId: stored.id,
        paymentId: stored.paymentId,
        amount: stored.amount,
        currency: stored.currency,
        reason: stored.reason,
        status: stored.status,
        createdAt: stored.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to refund payment', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook event', error);
      throw error;
    }
  }

  // Private helper methods

  private async handlePaymentIntentSucceeded(intent: any): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'COMPLETED' as PaymentStatus, completedAt: new Date() },
    });
  }

  private async handlePaymentIntentFailed(intent: any): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: {
        status: 'FAILED' as PaymentStatus,
        failureReason: intent.last_payment_error?.message,
      },
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data: { status: 'ACTIVE' as SubscriptionStatus },
    });
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED' as SubscriptionStatus,
        cancelledAt: new Date(),
      },
    });
  }

  private formatPaymentHistory(payment: Payment): PaymentHistoryResponse {
    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      type: payment.stripePaymentIntentId ? 'one-time' : 'checkout',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private formatSubscription(subscription: Subscription): SubscriptionResponse {
    return {
      id: subscription.id,
      petitionId: subscription.petitionId,
      userId: subscription.userId,
      amount: subscription.amount,
      currency: subscription.currency,
      interval: subscription.interval,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      createdAt: subscription.createdAt,
      canceledAt: subscription.cancelledAt,
    };
  }

  private mapInterval(
    interval: string,
  ): 'month' | 'year' {
    switch (interval) {
      case 'monthly':
        return 'month';
      case 'quarterly':
        return 'month'; // Stripe doesn't support quarterly, use month with interval_count: 3
      case 'yearly':
        return 'year';
      default:
        return 'month';
    }
  }
}
