import { MembershipSubscriptionStatus } from '@prisma/client';
import { InstitutionSubscriptionsService } from './institution-subscriptions.service';

describe('InstitutionSubscriptionsService', () => {
  const mockPrisma = {
    institution: {
      findUniqueOrThrow: jest.fn<Promise<unknown>, [unknown]>(),
    },
    institutionSubscription: {
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
  const mockWorkspacePlans = {
    isEnabled: jest.fn(),
    findActivePlanByKey: jest.fn(),
  };
  const mockActivityLogger = { logAsync: jest.fn() };

  let service: InstitutionSubscriptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);
    service = new InstitutionSubscriptionsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockEntitlementsService as never,
      mockWorkspacePlans as never,
      mockActivityLogger as never,
    );
  });

  const plan = {
    id: 'plan-1',
    key: 'INSTITUTION_ADVANCED_MONTHLY',
    name: 'Advanced',
    priceAmount: 200,
    currency: 'USD',
    interval: 'MONTHLY',
  };

  describe('subscribe', () => {
    it('REGRESSION: staff (non-officeholder) cannot subscribe the institution to a paid plan', async () => {
      await expect(
        service.subscribe('inst-1', 'staff-user', false, {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Only the institution officeholder');
      expect(mockWorkspacePlans.isEnabled).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when workspace billing is disabled', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(false);
      await expect(
        service.subscribe('inst-1', 'holder-user', true, {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not currently available');
    });

    it('creates a PENDING subscription and tags the checkout session', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(true);
      mockWorkspacePlans.findActivePlanByKey.mockResolvedValue(plan);
      mockPrisma.institutionSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'holder-user',
        email: 'a@b.com',
      });
      mockPrisma.institution.findUniqueOrThrow.mockResolvedValue({
        id: 'inst-1',
        name: 'Ministry of Example',
      });
      mockPrisma.institutionSubscription.create.mockResolvedValue({
        id: 'is-1',
      });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      const result = await service.subscribe('inst-1', 'holder-user', true, {
        planKey: plan.key,
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            institutionSubscriptionId: 'is-1',
            institutionId: 'inst-1',
            userId: 'holder-user',
            planKey: plan.key,
          },
        }),
      );
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/cs_1',
        institutionSubscriptionId: 'is-1',
      });
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(true);
      mockWorkspacePlans.findActivePlanByKey.mockResolvedValue(plan);
      mockPrisma.institutionSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'holder-user',
        email: 'a@b.com',
      });
      mockPrisma.institution.findUniqueOrThrow.mockResolvedValue({
        id: 'inst-1',
        name: 'Ministry of Example',
      });
      mockPrisma.institutionSubscription.create.mockResolvedValue({
        id: 'is-1',
      });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.subscribe('inst-1', 'holder-user', true, {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.institutionSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'is-1' },
      });
    });
  });

  describe('cancelSubscription', () => {
    it('REGRESSION: staff (non-officeholder) cannot cancel the institution subscription', async () => {
      await expect(
        service.cancelSubscription('inst-1', 'staff-user', false),
      ).rejects.toThrow('Only the institution officeholder');
    });

    it('throws NotFoundException when there is nothing active to cancel', async () => {
      mockPrisma.institutionSubscription.findFirst.mockResolvedValue(null);
      await expect(
        service.cancelSubscription('inst-1', 'holder-user', true),
      ).rejects.toThrow('No active workspace subscription found');
    });

    it('cancels via the provider and revokes entitlements', async () => {
      mockPrisma.institutionSubscription.findFirst.mockResolvedValue({
        id: 'is-1',
        provider: 'STRIPE',
        providerSubscriptionId: 'sub_1',
      });
      mockPrisma.institutionSubscription.update.mockResolvedValue({
        id: 'is-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });

      await service.cancelSubscription('inst-1', 'holder-user', true);

      expect(mockStripeProvider.cancelSubscription).toHaveBeenCalledWith(
        'sub_1',
      );
      expect(mockPrisma.institutionSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'is-1' },
          data: expect.objectContaining({
            status: MembershipSubscriptionStatus.CANCELLED,
          }) as unknown,
        }),
      );
    });
  });
});
