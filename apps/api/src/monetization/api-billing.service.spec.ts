import { ApiKeyStatus, MembershipSubscriptionStatus } from '@prisma/client';
import { ApiBillingService } from './api-billing.service';

describe('ApiBillingService', () => {
  const mockPrisma = {
    apiPlan: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    apiSubscription: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    apiKey: {
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    apiUsageDaily: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    entitlementGrant: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
  };

  const mockStripeProvider = {
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
  };
  const mockMomoProvider = {
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
  };
  const mockEntitlementsService = { grant: jest.fn(), revoke: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: ApiBillingService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);
    service = new ApiBillingService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockEntitlementsService as never,
      mockActivityLogger as never,
    );
  });

  const plan = {
    id: 'plan-1',
    key: 'API_BASIC_MONTHLY',
    name: 'Basic',
    priceAmount: 10,
    currency: 'USD',
    interval: 'MONTHLY',
  };

  describe('subscribe', () => {
    it('throws NotFoundException for an unknown or inactive plan', async () => {
      mockPrisma.apiPlan.findUnique.mockResolvedValue(null);
      await expect(
        service.subscribe('user-1', {
          planKey: 'GHOST',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not found');
    });

    it('rejects a second subscription while one is active or pending', async () => {
      mockPrisma.apiPlan.findUnique.mockResolvedValue({
        ...plan,
        active: true,
      });
      mockPrisma.apiSubscription.findFirst.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.subscribe('user-1', {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('already have an active or pending');
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockPrisma.apiPlan.findUnique.mockResolvedValue({
        ...plan,
        active: true,
      });
      mockPrisma.apiSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.apiSubscription.create.mockResolvedValue({ id: 'api-sub-1' });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.subscribe('user-1', {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.apiSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'api-sub-1' },
      });
    });
  });

  describe('cancelSubscription', () => {
    it('throws NotFoundException when there is nothing active to cancel', async () => {
      mockPrisma.apiSubscription.findFirst.mockResolvedValue(null);
      await expect(service.cancelSubscription('user-1')).rejects.toThrow(
        'No active API subscription found',
      );
    });

    it('REGRESSION: revokes every active API key when the subscription is cancelled', async () => {
      mockPrisma.apiSubscription.findFirst.mockResolvedValue({
        id: 'api-sub-1',
        provider: 'STRIPE',
        providerSubscriptionId: 'sub_1',
      });
      mockPrisma.apiSubscription.update.mockResolvedValue({
        id: 'api-sub-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });

      await service.cancelSubscription('user-1');

      expect(mockPrisma.apiKey.updateMany).toHaveBeenCalledWith({
        where: { subscriptionId: 'api-sub-1', status: ApiKeyStatus.ACTIVE },
        data: expect.objectContaining({
          status: ApiKeyStatus.REVOKED,
        }) as unknown,
      });
    });
  });

  describe('createKey', () => {
    it('throws ForbiddenException without an active subscription', async () => {
      mockPrisma.apiSubscription.findFirst.mockResolvedValue(null);
      await expect(service.createKey('user-1')).rejects.toThrow(
        'An active API subscription is required',
      );
    });

    it('REGRESSION: only ever stores a hash of the key, never the raw value', async () => {
      mockPrisma.apiSubscription.findFirst.mockResolvedValue({
        id: 'api-sub-1',
      });
      mockPrisma.apiKey.create.mockImplementation((args: unknown) => {
        const { data } = args as { data: object };
        return Promise.resolve({ id: 'key-1', ...data });
      });

      const { apiKey, rawKey } = await service.createKey('user-1');

      expect(rawKey).toMatch(/^cl_[0-9a-f]{48}$/);
      const createCall = mockPrisma.apiKey.create.mock.calls[0][0] as {
        data: { keyHash: string };
      };
      expect(createCall.data.keyHash).not.toBe(rawKey);
      expect(createCall.data.keyHash).toHaveLength(64); // sha256 hex
      expect(apiKey.keyPrefix).toBe(rawKey.slice(0, 10));
    });
  });

  describe('revokeKey', () => {
    it('throws NotFoundException for a key belonging to a different user', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        subscription: { userId: 'someone-else' },
      });
      await expect(service.revokeKey('user-1', 'key-1')).rejects.toThrow(
        'not found',
      );
    });
  });
});
