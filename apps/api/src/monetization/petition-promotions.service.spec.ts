import { PetitionPromotionsService } from './petition-promotions.service';

describe('PetitionPromotionsService', () => {
  const mockPrisma = {
    petition: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    petitionPromotion: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  const mockStripeProvider = {
    createCheckoutSession: jest.fn(),
  };
  const mockMomoProvider = {
    createCheckoutSession: jest.fn(),
  };
  const mockFeatureFlags = { getConfig: jest.fn(), setToggle: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: PetitionPromotionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PetitionPromotionsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockFeatureFlags as never,
      mockActivityLogger as never,
    );
  });

  describe('promote', () => {
    const petition = {
      id: 'pet-1',
      title: 'Fix the road',
      signaturesCount: 42,
      status: 'ACTIVE',
    };

    beforeEach(() => {
      mockPrisma.petition.findUnique.mockResolvedValue(petition);
      mockPrisma.petitionPromotion.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockFeatureFlags.getConfig.mockResolvedValue({
        FEATURED_HOME: 100,
        TRENDING_BOOST: 50,
        CATEGORY_TOP: 30,
      });
    });

    it('throws NotFoundException for an unknown petition', async () => {
      mockPrisma.petition.findUnique.mockResolvedValue(null);
      await expect(
        service.promote('user-1', 'ghost', {
          placement: 'FEATURED_HOME',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not found');
    });

    it('rejects a second promotion for the same petition+placement while one is pending or active', async () => {
      mockPrisma.petitionPromotion.findFirst.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.promote('user-1', 'pet-1', {
          placement: 'FEATURED_HOME',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('already has a pending or active');
    });

    it('requires the purchaser to have an email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: null,
      });
      await expect(
        service.promote('user-1', 'pet-1', {
          placement: 'FEATURED_HOME',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('email address is required');
    });

    it('prices the purchase from the configured pricing map by placement', async () => {
      mockPrisma.petitionPromotion.create.mockResolvedValue({ id: 'promo-1' });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      await service.promote('user-1', 'pet-1', {
        placement: 'TRENDING_BOOST',
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockPrisma.petitionPromotion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 50 }) as unknown,
        }),
      );
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50 }),
      );
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockPrisma.petitionPromotion.create.mockResolvedValue({ id: 'promo-1' });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.promote('user-1', 'pet-1', {
          placement: 'FEATURED_HOME',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.petitionPromotion.delete).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
      });
    });

    it('CIVIC PRINCIPLE: never writes to the Petition row at all — only creates a PetitionPromotion', async () => {
      mockPrisma.petitionPromotion.create.mockResolvedValue({ id: 'promo-1' });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      await service.promote('user-1', 'pet-1', {
        placement: 'FEATURED_HOME',
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockPrisma.petition.update).not.toHaveBeenCalled();
    });
  });

  describe('listFeatured', () => {
    it('returns only the petitions, never a signature-count-altering write', async () => {
      mockPrisma.petitionPromotion.findMany.mockResolvedValue([
        { petition: { id: 'pet-1', title: 'A' } },
        { petition: { id: 'pet-2', title: 'B' } },
      ]);

      const result = await service.listFeatured('FEATURED_HOME');

      expect(result).toEqual([
        { id: 'pet-1', title: 'A' },
        { id: 'pet-2', title: 'B' },
      ]);
      expect(mockPrisma.petition.update).not.toHaveBeenCalled();
    });
  });
});
