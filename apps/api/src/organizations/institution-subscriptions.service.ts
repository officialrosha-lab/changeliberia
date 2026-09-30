import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntitlementScope,
  InstitutionSubscription,
  MembershipSubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import {
  BillingInterval,
  PaymentProvider,
} from '../payments/providers/payment-provider.interface';
import { WorkspacePlansService } from './workspace-plans.service';
import { revokeInstitutionEntitlements } from './workspace-webhook.util';

const ACTIVE_SUBSCRIPTION_STATUSES: MembershipSubscriptionStatus[] = [
  MembershipSubscriptionStatus.PENDING,
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAST_DUE,
];

export interface SubscribeInstitutionDto {
  planKey: string;
  successUrl: string;
  cancelUrl: string;
}

function toBillingInterval(
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
): BillingInterval {
  switch (interval) {
    case 'YEARLY':
      return 'yearly';
    case 'QUARTERLY':
      return 'quarterly';
    default:
      return 'monthly';
  }
}

/**
 * Institution workspace billing — the government-workspace upsell from
 * plan §B3. This only ever gates optional advanced tooling; a verified
 * lawmaker's basic constituency access (data, reports, notifications)
 * stays free regardless of subscription status, per the platform's
 * non-negotiable civic principle. Authorization (officeholder vs. staff)
 * is the caller's responsibility — every method here takes an explicit
 * `isOfficeholder` flag rather than re-deriving it, since that logic
 * already lives in OfficialOwnershipGuard.
 */
@Injectable()
export class InstitutionSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly entitlementsService: EntitlementsService,
    private readonly workspacePlans: WorkspacePlansService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async subscribe(
    institutionId: string,
    actorUserId: string,
    isOfficeholder: boolean,
    dto: SubscribeInstitutionDto,
  ): Promise<{ checkoutUrl: string; institutionSubscriptionId: string }> {
    if (!isOfficeholder) {
      throw new ForbiddenException(
        'Only the institution officeholder can manage its workspace subscription',
      );
    }
    if (!(await this.workspacePlans.isEnabled())) {
      throw new ForbiddenException(
        'Workspace billing is not currently available',
      );
    }
    const plan = await this.workspacePlans.findActivePlanByKey(
      dto.planKey,
      EntitlementScope.INSTITUTION,
    );
    if (!plan) {
      throw new NotFoundException(`Plan not found: ${dto.planKey}`);
    }

    const existing = await this.prisma.institutionSubscription.findFirst({
      where: { institutionId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
    });
    if (existing) {
      throw new ConflictException(
        'This institution already has an active or pending subscription',
      );
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
    });
    if (!actor?.email) {
      throw new BadRequestException(
        'An email address is required to subscribe to a workspace plan',
      );
    }

    const institution = await this.prisma.institution.findUniqueOrThrow({
      where: { id: institutionId },
    });

    const subscription = await this.prisma.institutionSubscription.create({
      data: {
        institutionId,
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
        description: `${institution.name} — ${plan.name}`,
        customerEmail: actor.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        recurringInterval: toBillingInterval(plan.interval),
        metadata: {
          institutionSubscriptionId: subscription.id,
          institutionId,
          userId: actorUserId,
          planKey: plan.key,
        },
      });
    } catch (error) {
      // Same failure-cleanup fix as MembershipsService.subscribe (Milestone
      // 8) and OrganizationsService.subscribe above — without it, a
      // provider failure would permanently lock this institution out of
      // ever retrying via the active-subscription conflict check.
      await this.prisma.institutionSubscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'INSTITUTION_SUBSCRIBE_INITIATED',
      entityType: 'INSTITUTION_SUBSCRIPTION',
      entityId: subscription.id,
      description: `Institution ${institutionId} started checkout for plan ${plan.key}`,
      changes: { institutionId, planKey: plan.key },
    });

    return {
      checkoutUrl: session.url ?? '',
      institutionSubscriptionId: subscription.id,
    };
  }

  async cancelSubscription(
    institutionId: string,
    actorUserId: string,
    isOfficeholder: boolean,
  ): Promise<InstitutionSubscription> {
    if (!isOfficeholder) {
      throw new ForbiddenException(
        'Only the institution officeholder can manage its workspace subscription',
      );
    }

    const subscription = await this.prisma.institutionSubscription.findFirst({
      where: {
        institutionId,
        status: {
          in: [
            MembershipSubscriptionStatus.ACTIVE,
            MembershipSubscriptionStatus.PAST_DUE,
          ],
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException('No active workspace subscription found');
    }
    if (subscription.providerSubscriptionId) {
      const provider = this.resolveProvider(subscription.provider);
      await provider.cancelSubscription(subscription.providerSubscriptionId);
    }

    const updated = await this.prisma.institutionSubscription.update({
      where: { id: subscription.id },
      data: {
        status: MembershipSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by institution officeholder',
      },
    });
    await revokeInstitutionEntitlements(
      this.prisma,
      this.entitlementsService,
      subscription.id,
    );

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'INSTITUTION_SUBSCRIPTION_CANCELLED',
      entityType: 'INSTITUTION_SUBSCRIPTION',
      entityId: subscription.id,
      description: `Institution ${institutionId} cancelled its workspace subscription`,
    });

    return updated;
  }

  async getSubscription(institutionId: string) {
    return this.prisma.institutionSubscription.findFirst({
      where: { institutionId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
