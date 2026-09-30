import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipInterval,
  MembershipPlan,
  MembershipSubscription,
  MembershipSubscriptionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { FeatureFlagService } from '../admin/feature-flag.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import {
  BillingInterval,
  PaymentProvider,
} from '../payments/providers/payment-provider.interface';
import { revokeMembershipEntitlements } from './membership-webhook.util';

const FEATURE_FLAG_NAME = 'MEMBERSHIP_ENABLED';
const ACTIVE_SUBSCRIPTION_STATUSES: MembershipSubscriptionStatus[] = [
  MembershipSubscriptionStatus.PENDING,
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAST_DUE,
];

export interface CreatePlanDto {
  key: string;
  name: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  interval: MembershipInterval;
  entitlementKeys?: string[];
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  priceAmount?: number;
  currency?: string;
  interval?: MembershipInterval;
  entitlementKeys?: string[];
  active?: boolean;
}

export interface SubscribeDto {
  planKey: string;
  successUrl: string;
  cancelUrl: string;
}

function toBillingInterval(interval: MembershipInterval): BillingInterval {
  switch (interval) {
    case MembershipInterval.YEARLY:
      return 'yearly';
    case MembershipInterval.QUARTERLY:
      return 'quarterly';
    default:
      return 'monthly';
  }
}

/**
 * The first real paid product on this platform (Milestone 8) — establishes
 * the generic checkout/subscribe/cancel/webhook-activation shape that later
 * monetization products (Organization billing, Sponsorships, ...) follow.
 *
 * Civic principle: this service and its routes are entirely separate from
 * the petition/poll controllers — a membership only ever grants optional
 * entitlements (see grantEntitlements below), never anything checked by
 * civic-principle.spec.ts's protected routes.
 */
@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly entitlementsService: EntitlementsService,
    private readonly featureFlags: FeatureFlagService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  isEnabled(): Promise<boolean> {
    return this.featureFlags.isEnabled(FEATURE_FLAG_NAME);
  }

  async setEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    await this.featureFlags.setToggle(
      FEATURE_FLAG_NAME,
      enabled,
      undefined,
      'Gates the public /memberships/plans and /memberships/subscribe routes (Milestone 8).',
    );
    return { enabled };
  }

  async listActivePlans(): Promise<MembershipPlan[]> {
    if (!(await this.isEnabled())) return [];
    return this.prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: { priceAmount: 'asc' },
    });
  }

  // ── Admin ──────────────────────────────────────────────────────────────

  async listAllPlans(): Promise<MembershipPlan[]> {
    return this.prisma.membershipPlan.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPlan(dto: CreatePlanDto): Promise<MembershipPlan> {
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Plan "${dto.key}" already exists`);
    }
    return this.prisma.membershipPlan.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency ?? 'USD',
        interval: dto.interval,
        entitlementKeys: JSON.stringify(dto.entitlementKeys ?? []),
      },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<MembershipPlan> {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan not found: ${id}`);

    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        priceAmount:
          dto.priceAmount !== undefined
            ? new Prisma.Decimal(dto.priceAmount)
            : undefined,
        currency: dto.currency,
        interval: dto.interval,
        entitlementKeys:
          dto.entitlementKeys !== undefined
            ? JSON.stringify(dto.entitlementKeys)
            : undefined,
        active: dto.active,
      },
    });
  }

  // ── User-facing ────────────────────────────────────────────────────────

  async subscribe(
    userId: string,
    dto: SubscribeDto,
  ): Promise<{ checkoutUrl: string; membershipSubscriptionId: string }> {
    if (!(await this.isEnabled())) {
      throw new ForbiddenException('Membership is not currently available');
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { key: dto.planKey },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException(`Plan not found: ${dto.planKey}`);
    }

    const existing = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an active or pending membership subscription',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      throw new BadRequestException(
        'An email address is required to subscribe to a membership plan',
      );
    }

    const subscription = await this.prisma.membershipSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: MembershipSubscriptionStatus.PENDING,
      },
    });

    const provider = this.resolveProvider('STRIPE');
    let session: Awaited<ReturnType<PaymentProvider['createCheckoutSession']>>;
    try {
      session = await provider.createCheckoutSession({
        amount: Number(plan.priceAmount),
        currency: plan.currency,
        description: plan.name,
        customerEmail: user.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        recurringInterval: toBillingInterval(plan.interval),
        metadata: {
          membershipSubscriptionId: subscription.id,
          userId,
          planKey: plan.key,
        },
      });
    } catch (error) {
      // Checkout session creation failed after the PENDING row was created (it
      // must exist first so its id can be embedded in the session metadata).
      // Without this cleanup the row would permanently trip the
      // one-active-subscription-per-user conflict check above, locking the
      // user out of ever retrying.
      await this.prisma.membershipSubscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'MEMBERSHIP_SUBSCRIBE_INITIATED',
      entityType: 'MEMBERSHIP_SUBSCRIPTION',
      entityId: subscription.id,
      description: `User started checkout for membership plan ${plan.key}`,
      changes: { planKey: plan.key },
    });

    return {
      checkoutUrl: session.url ?? '',
      membershipSubscriptionId: subscription.id,
    };
  }

  async cancelMySubscription(userId: string): Promise<MembershipSubscription> {
    const subscription = await this.prisma.membershipSubscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            MembershipSubscriptionStatus.ACTIVE,
            MembershipSubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException('No active membership subscription found');
    }

    if (subscription.providerSubscriptionId) {
      const provider = this.resolveProvider(subscription.provider);
      await provider.cancelSubscription(subscription.providerSubscriptionId);
    }

    const updated = await this.prisma.membershipSubscription.update({
      where: { id: subscription.id },
      data: {
        status: MembershipSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by user',
      },
    });
    await revokeMembershipEntitlements(
      this.prisma,
      this.entitlementsService,
      subscription.id,
    );

    this.activityLogger.logAsync({
      userId,
      action: 'MEMBERSHIP_CANCELLED',
      entityType: 'MEMBERSHIP_SUBSCRIPTION',
      entityId: subscription.id,
      description: `User cancelled membership subscription`,
    });

    return updated;
  }

  async getMySubscription(userId: string) {
    return this.prisma.membershipSubscription.findFirst({
      where: { userId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Webhook-driven activation/cancellation/past-due handling lives in
  // WebhookEventHandlerService (payments module), which calls the shared
  // functions in membership-webhook.util.ts directly — see that file's
  // docstring for why this isn't routed through this service instead.
}
