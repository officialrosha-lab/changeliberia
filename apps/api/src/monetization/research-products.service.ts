import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseStatus,
  ResearchProduct,
  ResearchProductPurchase,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { StripeProviderAdapter } from '../payments/providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from '../payments/providers/momo-provider.adapter';
import { PaymentProvider } from '../payments/providers/payment-provider.interface';

export interface CreateResearchProductDto {
  key: string;
  title: string;
  description?: string;
  priceAmount: number;
  currency?: string;
  fileUrl?: string;
}

export interface UpdateResearchProductDto {
  title?: string;
  description?: string;
  priceAmount?: number;
  currency?: string;
  fileUrl?: string;
  active?: boolean;
}

export interface PurchaseResearchProductDto {
  productKey: string;
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class ResearchProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProviderAdapter,
    private readonly momoProvider: MoMoProviderAdapter,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  private resolveProvider(name: string): PaymentProvider {
    return name === 'MOMO' ? this.momoProvider : this.stripeProvider;
  }

  async listActiveProducts(): Promise<Omit<ResearchProduct, 'fileUrl'>[]> {
    // fileUrl is access-gated — never returned from the public catalog listing.
    const products = await this.prisma.researchProduct.findMany({
      where: { active: true },
      orderBy: { priceAmount: 'asc' },
    });
    return products.map((product) => {
      const { fileUrl, ...rest } = product;
      void fileUrl;
      return rest;
    });
  }

  async listAllProducts(): Promise<ResearchProduct[]> {
    return this.prisma.researchProduct.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createProduct(dto: CreateResearchProductDto): Promise<ResearchProduct> {
    const existing = await this.prisma.researchProduct.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(
        `Research product "${dto.key}" already exists`,
      );
    }
    return this.prisma.researchProduct.create({
      data: {
        key: dto.key,
        title: dto.title,
        description: dto.description,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency ?? 'USD',
        fileUrl: dto.fileUrl,
      },
    });
  }

  async updateProduct(
    id: string,
    dto: UpdateResearchProductDto,
  ): Promise<ResearchProduct> {
    const product = await this.prisma.researchProduct.findUnique({
      where: { id },
    });
    if (!product)
      throw new NotFoundException(`Research product not found: ${id}`);
    return this.prisma.researchProduct.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priceAmount:
          dto.priceAmount !== undefined
            ? new Prisma.Decimal(dto.priceAmount)
            : undefined,
        currency: dto.currency,
        fileUrl: dto.fileUrl,
        active: dto.active,
      },
    });
  }

  async purchase(
    userId: string,
    dto: PurchaseResearchProductDto,
  ): Promise<{ checkoutUrl: string; researchProductPurchaseId: string }> {
    const product = await this.prisma.researchProduct.findUnique({
      where: { key: dto.productKey },
    });
    if (!product || !product.active) {
      throw new NotFoundException(
        `Research product not found: ${dto.productKey}`,
      );
    }

    const existing = await this.prisma.researchProductPurchase.findFirst({
      where: {
        productId: product.id,
        purchaserUserId: userId,
        status: { in: [PurchaseStatus.PENDING, PurchaseStatus.COMPLETED] },
      },
    });
    if (existing) {
      throw new ConflictException(
        'You already own or are purchasing this research product',
      );
    }

    const purchaser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!purchaser?.email) {
      throw new BadRequestException(
        'An email address is required to purchase a research product',
      );
    }

    const purchase = await this.prisma.researchProductPurchase.create({
      data: { productId: product.id, purchaserUserId: userId },
    });

    const provider = this.resolveProvider('STRIPE');
    let checkoutUrl: string | null;
    try {
      const session = await provider.createCheckoutSession({
        amount: Number(product.priceAmount),
        currency: product.currency,
        description: `Research report — ${product.title}`,
        customerEmail: purchaser.email,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        metadata: {
          researchProductPurchaseId: purchase.id,
          userId,
          productKey: product.key,
        },
      });
      checkoutUrl = session.url;
    } catch (error) {
      await this.prisma.researchProductPurchase.delete({
        where: { id: purchase.id },
      });
      throw error;
    }

    this.activityLogger.logAsync({
      userId,
      action: 'RESEARCH_PRODUCT_PURCHASE_INITIATED',
      entityType: 'RESEARCH_PRODUCT_PURCHASE',
      entityId: purchase.id,
      description: `User started checkout for research product ${product.key}`,
      changes: { productKey: product.key },
    });

    return {
      checkoutUrl: checkoutUrl ?? '',
      researchProductPurchaseId: purchase.id,
    };
  }

  async listMine(userId: string): Promise<ResearchProductPurchase[]> {
    return this.prisma.researchProductPurchase.findMany({
      where: { purchaserUserId: userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Returns the gated download URL only if this user actually completed the purchase. */
  async getDownloadUrl(userId: string, productId: string): Promise<string> {
    const purchase = await this.prisma.researchProductPurchase.findFirst({
      where: {
        purchaserUserId: userId,
        productId,
        status: PurchaseStatus.COMPLETED,
      },
      include: { product: true },
    });
    if (!purchase) {
      throw new ForbiddenException(
        'You have not purchased this research product',
      );
    }
    if (!purchase.product.fileUrl) {
      throw new NotFoundException(
        'No file is attached to this research product yet',
      );
    }
    return purchase.product.fileUrl;
  }
}
