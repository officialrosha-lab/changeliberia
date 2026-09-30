import { randomBytes, createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiKey,
  ApiKeyStatus,
  ApiPlan,
  ApiSubscription,
  MembershipInterval,
  MembershipSubscriptionStatus,
  Prisma,
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
import { revokeApiSubscriptionEntitlements } from './monetization-webhook.util';

const ACTIVE_SUBSCRIPTION_STATUSES: MembershipSubscriptionStatus[] = [
  MembershipSubscriptionStatus.PENDING,
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAST_DUE,
];

export interface CreateApiPlanDto {
  key: string;
  name: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  interval: MembershipInterval;
  requestsPerDay: number;
  entitlementKeys?: string[];
}

export interface UpdateApiPlanDto {
  name?: string;
  description?: string;
  priceAmount?: number;
  currency?: string;
  interval?: MembershipInterval;
  requestsPerDay?: number;
  entitlementKeys?: string[];
  active?: boolean;
}

export interface SubscribeApiPlanDto {
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

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `cl_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash, prefix: raw.slice(0, 10) };
}

@Injectable()
export class ApiBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly entitlementsService: EntitlementsService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async listActivePlans(): Promise<ApiPlan[]> {
    return this.prisma.apiPlan.findMany({
      where: { active: true },
      orderBy: { priceAmount: 'asc' },
    });
  }

  async listAllPlans(): Promise<ApiPlan[]> {
    return this.prisma.apiPlan.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createPlan(dto: CreateApiPlanDto): Promise<ApiPlan> {
    const existing = await this.prisma.apiPlan.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`API plan "${dto.key}" already exists`);
    }
    return this.prisma.apiPlan.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency ?? 'USD',
        interval: dto.interval,
        requestsPerDay: dto.requestsPerDay,
        entitlementKeys: JSON.stringify(dto.entitlementKeys ?? []),
      },
    });
  }

  async updatePlan(id: string, dto: UpdateApiPlanDto): Promise<ApiPlan> {
    const plan = await this.prisma.apiPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`API plan not found: ${id}`);
    return this.prisma.apiPlan.update({
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
        requestsPerDay: dto.requestsPerDay,
        entitlementKeys:
          dto.entitlementKeys !== undefined
            ? JSON.stringify(dto.entitlementKeys)
            : undefined,
        active: dto.active,
      },
    });
  }

  async subscribe(
    userId: string,
    dto: SubscribeApiPlanDto,
  ): Promise<{ checkoutUrl: string; apiSubscriptionId: string }> {
    const plan = await this.prisma.apiPlan.findUnique({
      where: { key: dto.planKey },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException(`API plan not found: ${dto.planKey}`);
    }

    const existing = await this.prisma.apiSubscription.findFirst({
      where: { userId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an active or pending API subscription',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      throw new BadRequestException(
        'An email address is required to subscribe to an API plan',
      );
    }

    const subscription = await this.prisma.apiSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: MembershipSubscriptionStatus.PENDING,
      },
    });

    const provider = this.resolveProvider('STRIPE');
    let checkoutUrl: string | null;
    try {
      const session = await provider.createCheckoutSession({
        amount: Number(plan.priceAmount),
        currency: plan.currency,
        description: `API plan — ${plan.name}`,
        customerEmail: user.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        recurringInterval: toBillingInterval(plan.interval),
        metadata: {
          apiSubscriptionId: subscription.id,
          userId,
          planKey: plan.key,
        },
      });
      checkoutUrl = session.url;
    } catch (error) {
      await this.prisma.apiSubscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'API_SUBSCRIBE_INITIATED',
      entityType: 'API_SUBSCRIPTION',
      entityId: subscription.id,
      description: `User started checkout for API plan ${plan.key}`,
    });

    return {
      checkoutUrl: checkoutUrl ?? '',
      apiSubscriptionId: subscription.id,
    };
  }

  async cancelSubscription(userId: string): Promise<ApiSubscription> {
    const subscription = await this.prisma.apiSubscription.findFirst({
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
      throw new NotFoundException('No active API subscription found');
    }
    if (subscription.providerSubscriptionId) {
      const provider = this.resolveProvider(subscription.provider);
      await provider.cancelSubscription(subscription.providerSubscriptionId);
    }

    const updated = await this.prisma.apiSubscription.update({
      where: { id: subscription.id },
      data: {
        status: MembershipSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by user',
      },
    });
    await revokeApiSubscriptionEntitlements(
      this.prisma,
      this.entitlementsService,
      subscription.id,
    );
    await this.prisma.apiKey.updateMany({
      where: { subscriptionId: subscription.id, status: ApiKeyStatus.ACTIVE },
      data: { status: ApiKeyStatus.REVOKED, revokedAt: new Date() },
    });

    return updated;
  }

  async getMySubscription(userId: string) {
    return this.prisma.apiSubscription.findFirst({
      where: { userId, status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Returns the raw key exactly once — only its SHA-256 hash is ever stored. */
  async createKey(userId: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const subscription = await this.prisma.apiSubscription.findFirst({
      where: { userId, status: MembershipSubscriptionStatus.ACTIVE },
    });
    if (!subscription) {
      throw new ForbiddenException(
        'An active API subscription is required to create a key',
      );
    }
    const { raw, hash, prefix } = generateApiKey();
    const apiKey = await this.prisma.apiKey.create({
      data: {
        subscriptionId: subscription.id,
        keyHash: hash,
        keyPrefix: prefix,
      },
    });
    this.activityLogger.logAsync({
      userId,
      action: 'API_KEY_CREATED',
      entityType: 'API_KEY',
      entityId: apiKey.id,
      description: `User created API key ${prefix}...`,
    });
    return { apiKey, rawKey: raw };
  }

  async listMyKeys(userId: string): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: { subscription: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeKey(userId: string, keyId: string): Promise<ApiKey> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { subscription: true },
    });
    if (!apiKey || apiKey.subscription.userId !== userId) {
      throw new NotFoundException(`API key not found: ${keyId}`);
    }
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { status: ApiKeyStatus.REVOKED, revokedAt: new Date() },
    });
  }

  /** Records one request against today's usage rollup — call from API-gateway middleware once built. */
  async recordUsage(apiKeyId: string): Promise<void> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await this.prisma.apiUsageDaily.upsert({
      where: { apiKeyId_date: { apiKeyId, date: today } },
      create: { apiKeyId, date: today, requestCount: 1 },
      update: { requestCount: { increment: 1 } },
    });
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }
}
