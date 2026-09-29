import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { getStripeApiVersion } from '../../config/stripe.config';
import {
  ChargeOneTimeParams,
  CreateCheckoutSessionParams,
  CreateCustomerParams,
  CreateSubscriptionParams,
  PaymentProvider,
  ProviderCharge,
  ProviderCheckoutSession,
  ProviderCustomer,
  ProviderRefund,
  ProviderSubscription,
  ProviderTransaction,
  ProviderWebhookEvent,
  RefundParams,
} from './payment-provider.interface';

/** Stripe only supports month/year recurring intervals — quarterly is month × 3. */
function toStripeInterval(
  interval: CreateCheckoutSessionParams['recurringInterval'],
): {
  interval: 'month' | 'year';
  interval_count: number;
} {
  switch (interval) {
    case 'yearly':
      return { interval: 'year', interval_count: 1 };
    case 'quarterly':
      return { interval: 'month', interval_count: 3 };
    default:
      return { interval: 'month', interval_count: 1 };
  }
}

/**
 * Wraps the Stripe SDK directly (not `PaymentService`, which already
 * conflates the Stripe call with its own Prisma writes) — this adapter is
 * a pure external-API client, symmetric with `MoMoProviderAdapter`. Reads
 * the same `STRIPE_API_KEY`/`STRIPE_WEBHOOK_SECRET` env vars `PaymentService`
 * already uses; existing Stripe call sites in `payment.service.ts` are
 * untouched by this milestone.
 */
@Injectable()
export class StripeProviderAdapter implements PaymentProvider {
  readonly name = 'STRIPE' as const;
  private readonly logger = new Logger(StripeProviderAdapter.name);
  private readonly stripe: InstanceType<typeof Stripe> | null;
  private readonly webhookSecret: string;

  constructor() {
    const apiKey = process.env.STRIPE_API_KEY;
    this.stripe = apiKey
      ? new Stripe(apiKey, { apiVersion: getStripeApiVersion() })
      : null;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!this.stripe) {
      this.logger.warn(
        'STRIPE_API_KEY is not set — StripeProviderAdapter will be unavailable.',
      );
    }
  }

  isAvailable(): boolean {
    return !!this.stripe;
  }

  private getStripe(): InstanceType<typeof Stripe> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Payment processing is not configured on this server.',
      );
    }
    return this.stripe;
  }

  async createCustomer(
    params: CreateCustomerParams,
  ): Promise<ProviderCustomer> {
    const customer = await this.getStripe().customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
    return {
      id: customer.id,
      email: customer.email ?? null,
      name: customer.name ?? null,
    };
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<ProviderCheckoutSession> {
    const mode = params.recurringInterval ? 'subscription' : 'payment';
    const session = await this.getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: Math.round(params.amount * 100),
            product_data: { name: params.description },
            ...(params.recurringInterval && {
              recurring: toStripeInterval(params.recurringInterval),
            }),
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata,
    });
    return {
      id: session.id,
      url: session.url,
      amountTotal: (session.amount_total ?? 0) / 100,
      currency: session.currency || params.currency,
      status: session.payment_status || 'unpaid',
    };
  }

  /**
   * Creates (but does not confirm) a PaymentIntent — matches how this
   * codebase already handles one-time card charges: the client confirms
   * with `stripe.confirmCardPayment`, then `PaymentService.confirmPayment`
   * finalizes it server-side. Always returns PENDING; see the interface
   * docstring.
   */
  async chargeOneTime(params: ChargeOneTimeParams): Promise<ProviderCharge> {
    const intent = await this.getStripe().paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      payment_method_types: ['card'],
      description: params.description,
      metadata: params.metadata,
    });
    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: 'PENDING',
    };
  }

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<ProviderSubscription> {
    const product = await this.getStripe().products.create({
      name: params.description || 'Subscription',
      type: 'service',
    });
    const price = await this.getStripe().prices.create({
      product: product.id,
      unit_amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      recurring: toStripeInterval(params.interval),
    });
    const subscription = await this.getStripe().subscriptions.create({
      customer: params.customerId,
      items: [{ price: price.id }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: params.metadata,
    });
    const currentPeriodStart = subscription.items.data[0]?.current_period_start;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    return {
      id: subscription.id,
      customerId: params.customerId,
      status: subscription.status,
      currentPeriodStart: currentPeriodStart
        ? new Date(currentPeriodStart * 1000)
        : null,
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : null,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.getStripe().subscriptions.cancel(subscriptionId);
  }

  async refund(params: RefundParams): Promise<ProviderRefund> {
    const intent = await this.getStripe().paymentIntents.retrieve(
      params.transactionId,
    );
    const latestCharge = intent.latest_charge;
    const chargeId =
      typeof latestCharge === 'string' ? latestCharge : latestCharge?.id;
    if (!chargeId) {
      throw new BadRequestException('No charge found for this payment intent');
    }
    const refund = await this.getStripe().refunds.create({
      charge: chargeId,
      amount: params.amount ? Math.round(params.amount * 100) : undefined,
      reason: params.reason as
        | 'duplicate'
        | 'fraudulent'
        | 'requested_by_customer'
        | undefined,
    });
    return {
      id: refund.id,
      amount: (refund.amount ?? 0) / 100,
      currency: refund.currency,
      status: refund.status || 'pending',
    };
  }

  async getTransaction(transactionId: string): Promise<ProviderTransaction> {
    const intent =
      await this.getStripe().paymentIntents.retrieve(transactionId);
    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    try {
      this.getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): ProviderWebhookEvent {
    const event = this.getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
    return { id: event.id, type: event.type, data: event.data.object };
  }
}
