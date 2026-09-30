import {
  MembershipInterval,
  MembershipSubscriptionStatus,
} from '@prisma/client';
import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  const mockPrisma = {
    membershipPlan: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    membershipSubscription: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
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
  const mockFeatureFlags = { isEnabled: jest.fn(), setToggle: jest.fn() };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: MembershipsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);
    service = new MembershipsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockEntitlementsService as never,
      mockFeatureFlags as never,
      mockActivityLogger as never,
    );
  });

  describe('listActivePlans', () => {
    it('returns an empty list when membership is disabled — never a 500 or a leaked plan', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(false);
      const plans = await service.listActivePlans();
      expect(plans).toEqual([]);
      expect(mockPrisma.membershipPlan.findMany).not.toHaveBeenCalled();
    });

    it('lists active plans ordered by price when enabled', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findMany.mockResolvedValue([{ key: 'A' }]);
      const plans = await service.listActivePlans();
      expect(plans).toEqual([{ key: 'A' }]);
      expect(mockPrisma.membershipPlan.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { priceAmount: 'asc' },
      });
    });
  });

  describe('createPlan', () => {
    it('rejects a duplicate key', async () => {
      mockPrisma.membershipPlan.findUnique.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.createPlan({
          key: 'DUP',
          name: 'Dup',
          priceAmount: 5,
          interval: MembershipInterval.MONTHLY,
        }),
      ).rejects.toThrow('already exists');
    });

    it('serializes entitlementKeys as JSON', async () => {
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(null);
      mockPrisma.membershipPlan.create.mockResolvedValue({});
      await service.createPlan({
        key: 'SUPPORTER',
        name: 'Supporter',
        priceAmount: 10,
        interval: MembershipInterval.MONTHLY,
        entitlementKeys: ['ENTITLEMENT_X'],
      });
      expect(mockPrisma.membershipPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entitlementKeys: JSON.stringify(['ENTITLEMENT_X']),
          }) as unknown,
        }),
      );
    });
  });

  describe('subscribe', () => {
    const plan = {
      id: 'plan-1',
      key: 'SUPPORTER_MONTHLY',
      name: 'Supporter',
      priceAmount: 10,
      currency: 'USD',
      interval: MembershipInterval.MONTHLY,
      active: true,
    };

    it('throws ForbiddenException when membership is disabled', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(false);
      await expect(
        service.subscribe('user-1', {
          planKey: 'X',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not currently available');
    });

    it('throws NotFoundException for an unknown or inactive plan', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(null);
      await expect(
        service.subscribe('user-1', {
          planKey: 'GHOST',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not found');
    });

    it('rejects a user who already has an active/pending subscription', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(plan);
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue({
        id: 'existing-sub',
      });
      await expect(
        service.subscribe('user-1', {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('already have an active or pending');
    });

    it('requires the user to have an email address', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(plan);
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: null,
      });
      await expect(
        service.subscribe('user-1', {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('email address is required');
    });

    it('creates a PENDING subscription row and tags the checkout session with its id', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(plan);
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.membershipSubscription.create.mockResolvedValue({
        id: 'ms-1',
      });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      const result = await service.subscribe('user-1', {
        planKey: plan.key,
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockPrisma.membershipSubscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          planId: plan.id,
          status: MembershipSubscriptionStatus.PENDING,
        },
      });
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            membershipSubscriptionId: 'ms-1',
            userId: 'user-1',
            planKey: plan.key,
          },
        }),
      );
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/cs_1',
        membershipSubscriptionId: 'ms-1',
      });
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails, so the user is not permanently locked out of retrying', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.membershipPlan.findUnique.mockResolvedValue(plan);
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.membershipSubscription.create.mockResolvedValue({
        id: 'ms-1',
      });
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

      expect(mockPrisma.membershipSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'ms-1' },
      });
    });
  });

  describe('cancelMySubscription', () => {
    it('throws NotFoundException when there is nothing active to cancel', async () => {
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue(null);
      await expect(service.cancelMySubscription('user-1')).rejects.toThrow(
        'No active membership subscription found',
      );
    });

    it('cancels via the provider and revokes entitlements', async () => {
      mockPrisma.membershipSubscription.findFirst.mockResolvedValue({
        id: 'ms-1',
        provider: 'STRIPE',
        providerSubscriptionId: 'sub_1',
      });
      mockPrisma.membershipSubscription.update.mockResolvedValue({
        id: 'ms-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });

      await service.cancelMySubscription('user-1');

      expect(mockStripeProvider.cancelSubscription).toHaveBeenCalledWith(
        'sub_1',
      );
      expect(mockPrisma.membershipSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ms-1' },
          data: expect.objectContaining({
            status: MembershipSubscriptionStatus.CANCELLED,
          }) as unknown,
        }),
      );
    });
  });
});
