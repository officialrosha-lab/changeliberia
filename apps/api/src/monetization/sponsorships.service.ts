import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SponsorshipPackage,
  SponsorshipPurchase,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import { PaymentProvider } from '../payments/providers/payment-provider.interface';

export interface CreatePackageDto {
  key: string;
  name: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  durationDays: number;
}

export interface UpdatePackageDto {
  name?: string;
  description?: string;
  priceAmount?: number;
  currency?: string;
  durationDays?: number;
  active?: boolean;
}

export interface PurchaseSponsorshipDto {
  packageKey: string;
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class SponsorshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async listActivePackages(): Promise<SponsorshipPackage[]> {
    return this.prisma.sponsorshipPackage.findMany({
      where: { active: true },
      orderBy: { priceAmount: 'asc' },
    });
  }

  async listAllPackages(): Promise<SponsorshipPackage[]> {
    return this.prisma.sponsorshipPackage.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPackage(dto: CreatePackageDto): Promise<SponsorshipPackage> {
    const existing = await this.prisma.sponsorshipPackage.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Package "${dto.key}" already exists`);
    }
    return this.prisma.sponsorshipPackage.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency ?? 'USD',
        durationDays: dto.durationDays,
      },
    });
  }

  async updatePackage(
    id: string,
    dto: UpdatePackageDto,
  ): Promise<SponsorshipPackage> {
    const pkg = await this.prisma.sponsorshipPackage.findUnique({
      where: { id },
    });
    if (!pkg) throw new NotFoundException(`Package not found: ${id}`);
    return this.prisma.sponsorshipPackage.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        priceAmount:
          dto.priceAmount !== undefined
            ? new Prisma.Decimal(dto.priceAmount)
            : undefined,
        currency: dto.currency,
        durationDays: dto.durationDays,
        active: dto.active,
      },
    });
  }

  async purchase(
    userId: string,
    dto: PurchaseSponsorshipDto,
  ): Promise<{ checkoutUrl: string; sponsorshipPurchaseId: string }> {
    const pkg = await this.prisma.sponsorshipPackage.findUnique({
      where: { key: dto.packageKey },
    });
    if (!pkg || !pkg.active) {
      throw new NotFoundException(`Package not found: ${dto.packageKey}`);
    }

    const purchaser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!purchaser?.email) {
      throw new BadRequestException(
        'An email address is required to purchase a sponsorship',
      );
    }

    const purchase = await this.prisma.sponsorshipPurchase.create({
      data: { packageId: pkg.id, purchaserUserId: userId },
    });

    const provider = this.resolveProvider('STRIPE');
    let checkoutUrl: string | null;
    try {
      const session = await provider.createCheckoutSession({
        amount: Number(pkg.priceAmount),
        currency: pkg.currency,
        description: `Sponsorship — ${pkg.name}`,
        customerEmail: purchaser.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        metadata: {
          sponsorshipPurchaseId: purchase.id,
          userId,
          packageKey: pkg.key,
        },
      });
      checkoutUrl = session.url;
    } catch (error) {
      await this.prisma.sponsorshipPurchase.delete({
        where: { id: purchase.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'SPONSORSHIP_PURCHASE_INITIATED',
      entityType: 'SPONSORSHIP_PURCHASE',
      entityId: purchase.id,
      description: `User started checkout for sponsorship package ${pkg.key}`,
      changes: { packageKey: pkg.key },
    });

    return {
      checkoutUrl: checkoutUrl ?? '',
      sponsorshipPurchaseId: purchase.id,
    };
  }

  async listMine(userId: string): Promise<SponsorshipPurchase[]> {
    return this.prisma.sponsorshipPurchase.findMany({
      where: { purchaserUserId: userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllPurchases() {
    return this.prisma.sponsorshipPurchase.findMany({
      include: {
        package: true,
        sponsor: true,
        purchaser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin fulfillment: links a completed purchase to an actual logo-wall Sponsor row. */
  async fulfill(
    purchaseId: string,
    sponsorId: string,
  ): Promise<SponsorshipPurchase> {
    const purchase = await this.prisma.sponsorshipPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase)
      throw new NotFoundException(`Purchase not found: ${purchaseId}`);
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id: sponsorId },
    });
    if (!sponsor)
      throw new NotFoundException(`Sponsor not found: ${sponsorId}`);
    return this.prisma.sponsorshipPurchase.update({
      where: { id: purchaseId },
      data: { sponsorId },
    });
  }
}
