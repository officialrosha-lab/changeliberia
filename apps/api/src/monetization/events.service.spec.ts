import { PurchaseStatus } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const mockPrisma = {
    event: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    eventRegistration: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  const mockStripeProvider = { createCheckoutSession: jest.fn() };
  const mockMomoProvider = { createCheckoutSession: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockActivityLogger as never,
    );
  });

  describe('register', () => {
    it('throws NotFoundException for an unknown or inactive event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.register('user-1', 'ghost', {})).rejects.toThrow(
        'not found',
      );
    });

    it('rejects a duplicate active registration', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        active: true,
        capacity: null,
        priceAmount: null,
      });
      mockPrisma.eventRegistration.findUnique.mockResolvedValue({
        status: 'REGISTERED',
      });
      await expect(service.register('user-1', 'ev-1', {})).rejects.toThrow(
        'already registered',
      );
    });

    it('rejects registration once capacity is reached', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        active: true,
        capacity: 2,
        priceAmount: null,
      });
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      mockPrisma.eventRegistration.count.mockResolvedValue(2);
      await expect(service.register('user-1', 'ev-1', {})).rejects.toThrow(
        'at capacity',
      );
    });

    it('registers immediately with COMPLETED purchaseStatus for a free event, no checkout', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        key: 'ev-1',
        active: true,
        capacity: null,
        priceAmount: null,
      });
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      mockPrisma.eventRegistration.upsert.mockResolvedValue({ id: 'reg-1' });

      const result = await service.register('user-1', 'ev-1', {});

      expect(mockPrisma.eventRegistration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            purchaseStatus: PurchaseStatus.COMPLETED,
          }) as unknown,
        }),
      );
      expect(mockStripeProvider.createCheckoutSession).not.toHaveBeenCalled();
      expect(result).toEqual({ checkoutUrl: null, registrationId: 'reg-1' });
    });

    it('requires successUrl/cancelUrl for a paid event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        active: true,
        capacity: null,
        priceAmount: 25,
        currency: 'USD',
      });
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      await expect(service.register('user-1', 'ev-1', {})).rejects.toThrow(
        'successUrl and cancelUrl are required',
      );
    });

    it('REGRESSION: resets the registration to CANCELLED (not delete — unique constraint requires it to re-upsert) when checkout session creation fails for a paid event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ev-1',
        key: 'ev-1',
        title: 'Paid Event',
        active: true,
        capacity: null,
        priceAmount: 25,
        currency: 'USD',
      });
      mockPrisma.eventRegistration.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.eventRegistration.upsert.mockResolvedValue({ id: 'reg-1' });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.register('user-1', 'ev-1', {
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reg-1' },
          data: expect.objectContaining({ status: 'CANCELLED' }) as unknown,
        }),
      );
    });
  });
});
