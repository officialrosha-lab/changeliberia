import { PurchaseStatus } from '@prisma/client';
import { ResearchProductsService } from './research-products.service';

describe('ResearchProductsService', () => {
  const mockPrisma = {
    researchProduct: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    researchProductPurchase: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  const mockStripeProvider = { createCheckoutSession: jest.fn() };
  const mockMomoProvider = { createCheckoutSession: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: ResearchProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ResearchProductsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockActivityLogger as never,
    );
  });

  describe('listActiveProducts', () => {
    it('REGRESSION: never returns the gated fileUrl in the public catalog listing', async () => {
      mockPrisma.researchProduct.findMany.mockResolvedValue([
        {
          id: 'rp-1',
          key: 'REPORT_A',
          title: 'Report A',
          priceAmount: 20,
          fileUrl: 'https://secret-bucket/report-a.pdf',
        },
      ]);

      const result = await service.listActiveProducts();

      expect(result[0]).not.toHaveProperty('fileUrl');
    });
  });

  describe('purchase', () => {
    const product = {
      id: 'rp-1',
      key: 'REPORT_A',
      title: 'Report A',
      priceAmount: 20,
      currency: 'USD',
      active: true,
    };

    it('throws NotFoundException for an unknown or inactive product', async () => {
      mockPrisma.researchProduct.findUnique.mockResolvedValue(null);
      await expect(
        service.purchase('user-1', {
          productKey: 'GHOST',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not found');
    });

    it('rejects a user who already owns or is purchasing this product', async () => {
      mockPrisma.researchProduct.findUnique.mockResolvedValue(product);
      mockPrisma.researchProductPurchase.findFirst.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.purchase('user-1', {
          productKey: 'REPORT_A',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('already own or are purchasing');
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockPrisma.researchProduct.findUnique.mockResolvedValue(product);
      mockPrisma.researchProductPurchase.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.researchProductPurchase.create.mockResolvedValue({
        id: 'rpp-1',
      });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.purchase('user-1', {
          productKey: 'REPORT_A',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.researchProductPurchase.delete).toHaveBeenCalledWith({
        where: { id: 'rpp-1' },
      });
    });
  });

  describe('getDownloadUrl', () => {
    it('REGRESSION: refuses a user who never completed a purchase (never leaks the file behind an unpaid request)', async () => {
      mockPrisma.researchProductPurchase.findFirst.mockResolvedValue(null);
      await expect(service.getDownloadUrl('user-1', 'rp-1')).rejects.toThrow(
        'You have not purchased',
      );
    });

    it('returns the fileUrl for a user with a COMPLETED purchase', async () => {
      mockPrisma.researchProductPurchase.findFirst.mockResolvedValue({
        id: 'rpp-1',
        status: PurchaseStatus.COMPLETED,
        product: { fileUrl: 'https://secret-bucket/report-a.pdf' },
      });

      const url = await service.getDownloadUrl('user-1', 'rp-1');

      expect(url).toBe('https://secret-bucket/report-a.pdf');
    });
  });
});
