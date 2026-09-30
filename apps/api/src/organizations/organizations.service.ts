import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntitlementScope,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  OrganizationSubscription,
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
import { revokeOrganizationEntitlements } from './workspace-webhook.util';

// Seats an organization may fill with no paid subscription — small-team
// civic collaboration (coordinating a petition, sharing a Civic Pulse
// dashboard) stays free; a subscription only lifts this ceiling.
const FREE_SEAT_LIMIT = 5;

const ACTIVE_SUBSCRIPTION_STATUSES: MembershipSubscriptionStatus[] = [
  MembershipSubscriptionStatus.PENDING,
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAST_DUE,
];

const MANAGE_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
];

export interface CreateOrganizationDto {
  name: string;
  slug?: string;
  institutionId?: string;
}

export interface AddMemberDto {
  email: string;
  role?: OrganizationRole;
}

export interface SubscribeOrganizationDto {
  planKey: string;
  successUrl: string;
  cancelUrl: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'organization'
  );
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

@Injectable()
export class OrganizationsService {
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

  private async requireMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
    return membership;
  }

  private async requireManageRole(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership> {
    const membership = await this.requireMembership(organizationId, userId);
    if (!MANAGE_ROLES.includes(membership.role)) {
      throw new ForbiddenException(
        'Only an organization owner or admin can do this',
      );
    }
    return membership;
  }

  async createOrganization(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<Organization> {
    if (dto.institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new NotFoundException(
          `Institution not found: ${dto.institutionId}`,
        );
      }
      if (institution.holderUserId !== userId) {
        throw new ForbiddenException(
          'Only the institution officeholder can link an organization to it',
        );
      }
    }

    const baseSlug = slugify(dto.slug ?? dto.name);
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        institutionId: dto.institutionId,
        memberships: {
          create: { userId, role: OrganizationRole.OWNER },
        },
      },
    });

    this.activityLogger.logAsync({
      userId,
      action: 'ORGANIZATION_CREATED',
      entityType: 'ORGANIZATION',
      entityId: organization.id,
      description: `User created organization ${organization.name}`,
    });

    return organization;
  }

  async listMyOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.organization, myRole: m.role }));
  }

  async getOrganization(organizationId: string, userId: string) {
    await this.requireMembership(organizationId, userId);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!organization) {
      throw new NotFoundException(`Organization not found: ${organizationId}`);
    }
    return organization;
  }

  async addMember(
    organizationId: string,
    actorUserId: string,
    dto: AddMemberDto,
  ): Promise<OrganizationMembership> {
    await this.requireManageRole(organizationId, actorUserId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `No existing Change Liberia account found for ${dto.email}`,
      );
    }

    const existing = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUser.id },
      },
    });
    if (existing) {
      throw new ConflictException('This user is already a member');
    }

    const seatLimit = await this.currentSeatLimit(organizationId);
    if (seatLimit !== null) {
      const memberCount = await this.prisma.organizationMembership.count({
        where: { organizationId },
      });
      if (memberCount >= seatLimit) {
        throw new ConflictException(
          `This organization is at its ${seatLimit}-seat limit. Upgrade the workspace plan to add more members.`,
        );
      }
    }

    const membership = await this.prisma.organizationMembership.create({
      data: {
        organizationId,
        userId: targetUser.id,
        role: dto.role ?? OrganizationRole.MEMBER,
      },
    });

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'ORGANIZATION_MEMBER_ADDED',
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      description: `Added ${dto.email} to organization ${organizationId}`,
      changes: { targetUserId: targetUser.id, role: membership.role },
    });

    return membership;
  }

  async removeMember(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const isSelf = actorUserId === targetUserId;
    if (!isSelf) {
      await this.requireManageRole(organizationId, actorUserId);
    } else {
      await this.requireMembership(organizationId, actorUserId);
    }

    const target = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!target) throw new NotFoundException('Membership not found');

    if (target.role === OrganizationRole.OWNER) {
      const ownerCount = await this.prisma.organizationMembership.count({
        where: { organizationId, role: OrganizationRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'An organization must have at least one owner',
        );
      }
    }

    await this.prisma.organizationMembership.delete({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'ORGANIZATION_MEMBER_REMOVED',
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      description: `Removed member ${targetUserId} from organization ${organizationId}`,
    });
  }

  async updateMemberRole(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMembership> {
    const actor = await this.requireMembership(organizationId, actorUserId);
    if (actor.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException(
        'Only an organization owner can change roles',
      );
    }

    const target = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!target) throw new NotFoundException('Membership not found');

    if (
      target.role === OrganizationRole.OWNER &&
      role !== OrganizationRole.OWNER
    ) {
      const ownerCount = await this.prisma.organizationMembership.count({
        where: { organizationId, role: OrganizationRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'An organization must have at least one owner',
        );
      }
    }

    return this.prisma.organizationMembership.update({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
      data: { role },
    });
  }

  private async currentSeatLimit(
    organizationId: string,
  ): Promise<number | null> {
    const activeSubscription =
      await this.prisma.organizationSubscription.findFirst({
        where: { organizationId, status: MembershipSubscriptionStatus.ACTIVE },
        include: { plan: true },
      });
    if (!activeSubscription) return FREE_SEAT_LIMIT;
    return activeSubscription.plan.seatLimit;
  }

  async subscribe(
    organizationId: string,
    actorUserId: string,
    dto: SubscribeOrganizationDto,
  ): Promise<{ checkoutUrl: string; organizationSubscriptionId: string }> {
    await this.requireManageRole(organizationId, actorUserId);

    if (!(await this.workspacePlans.isEnabled())) {
      throw new ForbiddenException(
        'Workspace billing is not currently available',
      );
    }
    const plan = await this.workspacePlans.findActivePlanByKey(
      dto.planKey,
      EntitlementScope.ORGANIZATION,
    );
    if (!plan) {
      throw new NotFoundException(`Plan not found: ${dto.planKey}`);
    }

    const existing = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
    });
    if (existing) {
      throw new ConflictException(
        'This organization already has an active or pending subscription',
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

    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const subscription = await this.prisma.organizationSubscription.create({
      data: {
        organizationId,
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
        description: `${organization.name} — ${plan.name}`,
        customerEmail: actor.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        recurringInterval: toBillingInterval(plan.interval),
        metadata: {
          organizationSubscriptionId: subscription.id,
          organizationId,
          userId: actorUserId,
          planKey: plan.key,
        },
      });
    } catch (error) {
      // Same failure-cleanup fix as MembershipsService.subscribe (Milestone
      // 8): without deleting this row, a provider failure would permanently
      // trip the one-active-subscription-per-organization conflict check
      // above and lock the org out of ever retrying.
      await this.prisma.organizationSubscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'ORGANIZATION_SUBSCRIBE_INITIATED',
      entityType: 'ORGANIZATION_SUBSCRIPTION',
      entityId: subscription.id,
      description: `Organization ${organizationId} started checkout for plan ${plan.key}`,
      changes: { organizationId, planKey: plan.key },
    });

    return {
      checkoutUrl: session.url ?? '',
      organizationSubscriptionId: subscription.id,
    };
  }

  async cancelSubscription(
    organizationId: string,
    actorUserId: string,
  ): Promise<OrganizationSubscription> {
    await this.requireManageRole(organizationId, actorUserId);

    const subscription = await this.prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
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

    const updated = await this.prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        status: MembershipSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by organization admin',
      },
    });
    await revokeOrganizationEntitlements(
      this.prisma,
      this.entitlementsService,
      subscription.id,
    );

    this.activityLogger.logAsync({
      userId: actorUserId,
      action: 'ORGANIZATION_SUBSCRIPTION_CANCELLED',
      entityType: 'ORGANIZATION_SUBSCRIPTION',
      entityId: subscription.id,
      description: `Organization ${organizationId} cancelled its workspace subscription`,
    });

    return updated;
  }

  async getSubscription(organizationId: string, userId: string) {
    await this.requireMembership(organizationId, userId);
    return this.prisma.organizationSubscription.findFirst({
      where: { organizationId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
