import { SponsorshipsService } from './sponsorships.service';

describe('SponsorshipsService', () => {
  const mockPrisma = {
    sponsorshipPackage: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    sponsorshipPurchase: {
      create: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    sponsor: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  const mockStripeProvider = { createCheckoutSession: jest.fn() };
  const mockMomoProvider = { createCheckoutSession: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: SponsorshipsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SponsorshipsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockActivityLogger as never,
    );
  });

  describe('createPackage', () => {
    it('rejects a duplicate key', async () => {
      mockPrisma.sponsorshipPackage.findUnique.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.createPackage({
          key: 'DUP',
          name: 'Dup',
          priceAmount: 100,
          durationDays: 30,
        }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('purchase', () => {
    const pkg = {
      id: 'pkg-1',
      key: 'GOLD',
      name: 'Gold',
      priceAmount: 500,
      currency: 'USD',
      active: true,
    };

    it('throws NotFoundException for an unknown or inactive package', async () => {
      mockPrisma.sponsorshipPackage.findUnique.mockResolvedValue(null);
      await expect(
        service.purchase('user-1', {
          packageKey: 'GHOST',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not found');
    });

    it('requires the purchaser to have an email', async () => {
      mockPrisma.sponsorshipPackage.findUnique.mockResolvedValue(pkg);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: null,
      });
      await expect(
        service.purchase('user-1', {
          packageKey: 'GOLD',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('email address is required');
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockPrisma.sponsorshipPackage.findUnique.mockResolvedValue(pkg);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.sponsorshipPurchase.create.mockResolvedValue({ id: 'sp-1' });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.purchase('user-1', {
          packageKey: 'GOLD',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.sponsorshipPurchase.delete).toHaveBeenCalledWith({
        where: { id: 'sp-1' },
      });
    });

    it('tags the checkout session with the purchase id', async () => {
      mockPrisma.sponsorshipPackage.findUnique.mockResolvedValue(pkg);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.sponsorshipPurchase.create.mockResolvedValue({ id: 'sp-1' });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      await service.purchase('user-1', {
        packageKey: 'GOLD',
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            sponsorshipPurchaseId: 'sp-1',
            userId: 'user-1',
            packageKey: 'GOLD',
          },
        }),
      );
    });
  });

  describe('fulfill', () => {
    it('throws NotFoundException for an unknown purchase', async () => {
      mockPrisma.sponsorshipPurchase.findUnique.mockResolvedValue(null);
      await expect(service.fulfill('ghost', 'sponsor-1')).rejects.toThrow(
        'not found',
      );
    });

    it('throws NotFoundException for an unknown sponsor', async () => {
      mockPrisma.sponsorshipPurchase.findUnique.mockResolvedValue({
        id: 'sp-1',
      });
      mockPrisma.sponsor.findUnique.mockResolvedValue(null);
      await expect(service.fulfill('sp-1', 'ghost')).rejects.toThrow(
        'not found',
      );
    });

    it('links the purchase to the sponsor row', async () => {
      mockPrisma.sponsorshipPurchase.findUnique.mockResolvedValue({
        id: 'sp-1',
      });
      mockPrisma.sponsor.findUnique.mockResolvedValue({ id: 'sponsor-1' });
      mockPrisma.sponsorshipPurchase.update.mockResolvedValue({
        id: 'sp-1',
        sponsorId: 'sponsor-1',
      });

      await service.fulfill('sp-1', 'sponsor-1');

      expect(mockPrisma.sponsorshipPurchase.update).toHaveBeenCalledWith({
        where: { id: 'sp-1' },
        data: { sponsorId: 'sponsor-1' },
      });
    });
  });
});
