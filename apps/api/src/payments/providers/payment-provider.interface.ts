/**
 * Provider-agnostic payment abstraction (Milestone 7). All new monetization
 * billing code (memberships, organization/institution subscriptions,
 * sponsorships, ...) routes through this interface rather than calling
 * Stripe or MoMo directly — matches the shape RBAC/Entitlements already
 * established (an interface + concrete adapters, one per backing system).
 *
 * Every amount in these DTOs is in MAJOR units (dollars), matching the
 * existing Payment/Subscription/Donation/Refund convention in this
 * codebase — confirmed against payment.service.spec.ts's own fixtures
 * (`amount: 50` means $50, converted to cents only at the Stripe API
 * boundary via `Math.round(amount * 100)`). Never pass minor units here.
 *
 * `chargeOneTime` always returns a PENDING charge, for both providers —
 * this matches how this codebase already does one-time charges: a Stripe
 * PaymentIntent needs client-side confirmation, and a MoMo requestToPay
 * needs the user to approve a USSD/app prompt. Poll `getTransaction` or
 * wait for a webhook to observe the final SUCCEEDED/FAILED state.
 *
 * `refund` and `cancelSubscription` are not implemented for MoMo — the
 * existing `MoMoService` this adapter wraps has no refund or
 * cancel-preapproval API call, so `MoMoProviderAdapter` throws rather than
 * silently pretending support that doesn't exist.
 */

export type PaymentProviderName = 'STRIPE' | 'MOMO';

export interface ProviderCustomer {
  id: string;
  email: string | null;
  name: string | null;
}

export interface ProviderCheckoutSession {
  id: string;
  url: string | null;
  amountTotal: number;
  currency: string;
  status: string;
}

export interface ProviderCharge {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

export interface ProviderSubscription {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

export interface ProviderRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface ProviderTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface ProviderWebhookEvent {
  id: string;
  type: string;
  data: unknown;
}

export type BillingInterval = 'monthly' | 'quarterly' | 'yearly';

export interface CreateCustomerParams {
  email: string;
  name?: string;
  /** Required for MoMo — there is no true "customer" object, this is the payer's MSISDN. */
  phoneNumber?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  recurringInterval?: BillingInterval;
  metadata?: Record<string, string>;
}

export interface ChargeOneTimeParams {
  amount: number;
  currency: string;
  /** Stripe customer id. Ignored by the MoMo adapter. */
  customerId?: string;
  /** Required for MoMo. Ignored by the Stripe adapter. */
  phoneNumber?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  /** Stripe customer id, or the payer's phone number for MoMo pre-approval. */
  customerId: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  description?: string;
  metadata?: Record<string, string>;
}

export interface RefundParams {
  /** Stripe: the PaymentIntent id. */
  transactionId: string;
  /** Full refund when omitted. */
  amount?: number;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isAvailable(): boolean;
  createCustomer(params: CreateCustomerParams): Promise<ProviderCustomer>;
  createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<ProviderCheckoutSession>;
  chargeOneTime(params: ChargeOneTimeParams): Promise<ProviderCharge>;
  createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<ProviderSubscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  refund(params: RefundParams): Promise<ProviderRefund>;
  getTransaction(transactionId: string): Promise<ProviderTransaction>;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
  parseWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): ProviderWebhookEvent;
}
