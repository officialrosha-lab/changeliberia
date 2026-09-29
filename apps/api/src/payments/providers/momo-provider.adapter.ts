import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MoMoService } from './momo.service';
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

/**
 * Wraps the existing `MoMoService` (already a pure API client with no
 * Prisma writes of its own) behind the provider-agnostic interface. MoMo
 * has no hosted checkout page and no true "customer" object — a phone
 * number *is* the customer/payer identity here, so `createCustomer` just
 * validates and normalizes the number rather than calling any API.
 */
@Injectable()
export class MoMoProviderAdapter implements PaymentProvider {
  readonly name = 'MOMO' as const;

  constructor(private readonly momoService: MoMoService) {}

  isAvailable(): boolean {
    return this.momoService.isAvailable();
  }

  // Kept `async` (despite no `await`) so a validation throw becomes a
  // promise rejection, matching the interface's async contract and every
  // other unsupported-operation method below — a synchronous throw here
  // would bypass `await`/`.catch()` at call sites.
  // eslint-disable-next-line @typescript-eslint/require-await
  async createCustomer(
    params: CreateCustomerParams,
  ): Promise<ProviderCustomer> {
    if (!params.phoneNumber) {
      throw new BadRequestException(
        'phoneNumber is required to identify a MoMo customer',
      );
    }
    const normalized = this.momoService.normalizePhoneNumber(
      params.phoneNumber,
    );
    return {
      id: normalized,
      email: params.email || null,
      name: params.name || null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- see createCustomer
  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<ProviderCheckoutSession> {
    // MoMo has no hosted checkout page — callers should use chargeOneTime
    // (one-time) or createSubscription (recurring pre-approval) instead.
    throw new BadRequestException(
      `MoMo does not support hosted checkout sessions (requested: ${params.amount} ${params.currency}); use chargeOneTime or createSubscription`,
    );
  }

  async chargeOneTime(params: ChargeOneTimeParams): Promise<ProviderCharge> {
    if (!params.phoneNumber) {
      throw new BadRequestException(
        'phoneNumber is required for a MoMo charge',
      );
    }
    const externalId = crypto.randomUUID();
    const response = await this.momoService.requestToPay({
      amount: params.amount,
      currency: params.currency,
      phoneNumber: params.phoneNumber,
      externalId,
      description: params.description,
      paymentId: externalId,
    });
    return {
      id: response.referenceId,
      amount: params.amount,
      currency: params.currency,
      status: 'PENDING',
    };
  }

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<ProviderSubscription> {
    const externalId = crypto.randomUUID();
    const validityTimeInSeconds = 365 * 24 * 60 * 60;
    const preApproval = await this.momoService.createPreApproval({
      phoneNumber: params.customerId,
      maxAmount: params.amount * 12,
      validityTimeInSeconds,
      externalId,
      description: params.description,
    });
    return {
      id: preApproval.preapprovalId,
      customerId: params.customerId,
      status: preApproval.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: preApproval.expiresAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- see createCustomer
  async cancelSubscription(subscriptionId: string): Promise<void> {
    // MoMoService has no cancel-preapproval call — the sandbox collections
    // API this codebase integrates with doesn't expose one. Honest failure
    // instead of a silent no-op; pre-approvals otherwise expire on their own.
    throw new BadRequestException(
      `Cancelling MoMo pre-approval ${subscriptionId} is not supported by this integration`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- see createCustomer
  async refund(params: RefundParams): Promise<ProviderRefund> {
    // Same story as cancelSubscription — MoMoService has no refund call.
    throw new BadRequestException(
      `Refunding MoMo transaction ${params.transactionId} is not supported by this integration`,
    );
  }

  async getTransaction(transactionId: string): Promise<ProviderTransaction> {
    const status = await this.momoService.getTransactionStatus(transactionId);
    return {
      id: transactionId,
      amount: 0, // MoMo's status-poll response doesn't echo the amount back.
      currency: '',
      status: status.status,
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    const secret = process.env.MOMO_WEBHOOK_SECRET || '';
    if (!secret) return false;
    const payload =
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return false;
    }
    const expected = this.momoService.generateWebhookSignature(parsed, secret);
    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }

  parseWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): ProviderWebhookEvent {
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid MoMo webhook signature');
    }
    const payload =
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const data = JSON.parse(payload) as {
      referenceId?: string;
      status?: string;
    };
    return {
      id: data.referenceId || crypto.randomUUID(),
      type: data.status || 'unknown',
      data,
    };
  }
}
