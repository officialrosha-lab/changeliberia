import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PetitionPromotion,
  PlacementStatus,
  PromotionPlacement,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { FeatureFlagService } from '../admin/feature-flag.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import { PaymentProvider } from '../payments/providers/payment-provider.interface';

const PRICING_CONFIG_NAME = 'PETITION_PROMOTION_PRICING';

const DEFAULT_PRICING: Record<PromotionPlacement, number> = {
  FEATURED_HOME: 100,
  TRENDING_BOOST: 50,
  CATEGORY_TOP: 30,
};

const OPEN_STATUSES: PlacementStatus[] = [
  PlacementStatus.PENDING,
  PlacementStatus.ACTIVE,
];

export interface PromoteDto {
  placement: PromotionPlacement;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Paid petition placement — read-path only. Never touches
 * Petition.signaturesCount/status/governmentResponses; see
 * civic-principle.spec.ts, which asserts a promotion purchase leaves a
 * petition's signature count and status byte-for-byte unchanged.
 */
@Injectable()
export class PetitionPromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly featureFlags: FeatureFlagService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async getPricing(): Promise<Record<PromotionPlacement, number>> {
    return (
      (await this.featureFlags.getConfig<Record<PromotionPlacement, number>>(
        PRICING_CONFIG_NAME,
        DEFAULT_PRICING,
      )) ?? DEFAULT_PRICING
    );
  }

  async setPricing(
    pricing: Record<PromotionPlacement, number>,
  ): Promise<Record<PromotionPlacement, number>> {
    await this.featureFlags.setToggle(
      PRICING_CONFIG_NAME,
      true,
      JSON.stringify(pricing),
      'Per-placement pricing for paid petition promotion (Milestone 10). Always "enabled" — this row is a config carrier, not a feature gate.',
    );
    return pricing;
  }

  async promote(
    userId: string,
    petitionId: string,
    dto: PromoteDto,
  ): Promise<{ checkoutUrl: string; promotionId: string }> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition) {
      throw new NotFoundException(`Petition not found: ${petitionId}`);
    }

    const existing = await this.prisma.petitionPromotion.findFirst({
      where: {
        petitionId,
        placement: dto.placement,
        status: { in: OPEN_STATUSES },
      },
    });
    if (existing) {
      throw new ConflictException(
        `This petition already has a pending or active ${dto.placement} promotion`,
      );
    }

    const purchaser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!purchaser?.email) {
      throw new BadRequestException(
        'An email address is required to purchase a petition promotion',
      );
    }

    const pricing = await this.getPricing();
    const amount = pricing[dto.placement];

    const promotion = await this.prisma.petitionPromotion.create({
      data: {
        petitionId,
        purchaserUserId: userId,
        amount,
        currency: 'USD',
        placement: dto.placement,
        status: PlacementStatus.PENDING,
      },
    });

    const provider = this.resolveProvider('STRIPE');
    let checkoutUrl: string | null;
    try {
      const session = await provider.createCheckoutSession({
        amount,
        currency: 'USD',
        description: `Petition promotion — ${dto.placement} — ${petition.title}`,
        customerEmail: purchaser.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        metadata: { promotionId: promotion.id, petitionId, userId },
      });
      checkoutUrl = session.url;
    } catch (error) {
      // Same orphan-row cleanup as every other subscribe/purchase flow in
      // this codebase (Milestone 8/9) — without it, a provider failure
      // would leave a PENDING row blocking a retry of the same placement.
      await this.prisma.petitionPromotion.delete({
        where: { id: promotion.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'PETITION_PROMOTION_INITIATED',
      entityType: 'PETITION_PROMOTION',
      entityId: promotion.id,
      description: `User started checkout to promote petition ${petitionId} (${dto.placement})`,
      changes: { petitionId, placement: dto.placement, amount },
    });

    return { checkoutUrl: checkoutUrl ?? '', promotionId: promotion.id };
  }

  async listFeatured(placement: PromotionPlacement) {
    const now = new Date();
    const promotions = await this.prisma.petitionPromotion.findMany({
      where: { placement, status: PlacementStatus.ACTIVE, endsAt: { gt: now } },
      include: { petition: true },
      orderBy: { createdAt: 'desc' },
    });
    return promotions.map((p) => p.petition);
  }

  async listMine(userId: string): Promise<PetitionPromotion[]> {
    return this.prisma.petitionPromotion.findMany({
      where: { purchaserUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(): Promise<PetitionPromotion[]> {
    return this.prisma.petitionPromotion.findMany({
      include: { petition: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
