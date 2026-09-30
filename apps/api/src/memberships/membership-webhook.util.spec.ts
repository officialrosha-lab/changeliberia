import { MembershipSubscriptionStatus } from '@prisma/client';
import {
  activateMembershipSubscription,
  cancelMembershipSubscriptionByProviderSubscriptionId,
  grantMembershipEntitlements,
  markMembershipPastDue,
  revokeMembershipEntitlements,
} from './membership-webhook.util';

describe('membership-webhook.util', () => {
  const mockPrisma = {
    entitlement: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    entitlementGrant: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    membershipSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockEntitlementsService = { grant: jest.fn(), revoke: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('grantMembershipEntitlements', () => {
    const subscription = {
      id: 'ms-1',
      userId: 'user-1',
      plan: {
        entitlementKeys: JSON.stringify(['ENTITLEMENT_A', 'ENTITLEMENT_B']),
      },
    } as never;

    it('skips keys that have no matching Entitlement catalog row rather than throwing', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue(null);

      await grantMembershipEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        subscription,
      );

      expect(mockEntitlementsService.grant).not.toHaveBeenCalled();
    });

    it('grants each catalog-matched key exactly once', async () => {
      mockPrisma.entitlement.findUnique.mockImplementation((args: unknown) => {
        const { where } = args as { where: { key: string } };
        return Promise.resolve({ id: `ent-${where.key}`, key: where.key });
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      await grantMembershipEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        subscription,
      );

      expect(mockEntitlementsService.grant).toHaveBeenCalledTimes(2);
      expect(mockEntitlementsService.grant).toHaveBeenCalledWith({
        entitlementKey: 'ENTITLEMENT_A',
        userId: 'user-1',
        source: 'MEMBERSHIP_PLAN',
        sourceId: 'ms-1',
      });
      expect(mockEntitlementsService.grant).toHaveBeenCalledWith({
        entitlementKey: 'ENTITLEMENT_B',
        userId: 'user-1',
        source: 'MEMBERSHIP_PLAN',
        sourceId: 'ms-1',
      });
    });

    it('REGRESSION: is idempotent under webhook retry — an existing un-revoked grant is not re-granted', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
      });

      await grantMembershipEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'ms-1',
          userId: 'user-1',
          plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
        } as never,
      );

      expect(mockEntitlementsService.grant).not.toHaveBeenCalled();
    });

    it('tolerates malformed entitlementKeys JSON by granting nothing', async () => {
      await grantMembershipEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'ms-1',
          userId: 'user-1',
          plan: { entitlementKeys: 'not-json' },
        } as never,
      );

      expect(mockPrisma.entitlement.findUnique).not.toHaveBeenCalled();
      expect(mockEntitlementsService.grant).not.toHaveBeenCalled();
    });
  });

  describe('revokeMembershipEntitlements', () => {
    it('revokes every active grant sourced from this membership subscription', async () => {
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([
        { id: 'grant-1' },
        { id: 'grant-2' },
      ]);

      await revokeMembershipEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        'ms-1',
      );

      expect(mockPrisma.entitlementGrant.findMany).toHaveBeenCalledWith({
        where: { source: 'MEMBERSHIP_PLAN', sourceId: 'ms-1', revokedAt: null },
      });
      expect(mockEntitlementsService.revoke).toHaveBeenCalledWith('grant-1');
      expect(mockEntitlementsService.revoke).toHaveBeenCalledWith('grant-2');
    });
  });

  describe('activateMembershipSubscription', () => {
    it('marks the subscription ACTIVE, stores provider identifiers, and grants entitlements', async () => {
      mockPrisma.membershipSubscription.update.mockResolvedValue({
        id: 'ms-1',
        userId: 'user-1',
        plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
      });
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      const periodStart = new Date('2026-01-01');
      const periodEnd = new Date('2026-02-01');

      const result = await activateMembershipSubscription(
        mockPrisma as never,
        mockEntitlementsService as never,
        'ms-1',
        {
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          eventId: 'evt_1',
        },
      );

      expect(mockPrisma.membershipSubscription.update).toHaveBeenCalledWith({
        where: { id: 'ms-1' },
        data: {
          status: MembershipSubscriptionStatus.ACTIVE,
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          lastWebhookEventId: 'evt_1',
        },
        include: { plan: true },
      });
      expect(mockEntitlementsService.grant).toHaveBeenCalledWith(
        expect.objectContaining({ entitlementKey: 'ENTITLEMENT_A' }),
      );
      expect(result.id).toBe('ms-1');
    });
  });

  describe('cancelMembershipSubscriptionByProviderSubscriptionId', () => {
    it('returns null without writing anything when no subscription matches', async () => {
      mockPrisma.membershipSubscription.findUnique.mockResolvedValue(null);

      const result = await cancelMembershipSubscriptionByProviderSubscriptionId(
        mockPrisma as never,
        mockEntitlementsService as never,
        'sub_ghost',
        'evt_1',
      );

      expect(result).toBeNull();
      expect(mockPrisma.membershipSubscription.update).not.toHaveBeenCalled();
    });

    it('marks CANCELLED and revokes entitlements when a subscription matches', async () => {
      mockPrisma.membershipSubscription.findUnique.mockResolvedValue({
        id: 'ms-1',
      });
      mockPrisma.membershipSubscription.update.mockResolvedValue({
        id: 'ms-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);

      const result = await cancelMembershipSubscriptionByProviderSubscriptionId(
        mockPrisma as never,
        mockEntitlementsService as never,
        'sub_1',
        'evt_1',
      );

      expect(mockPrisma.membershipSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ms-1' },
          data: expect.objectContaining({
            status: MembershipSubscriptionStatus.CANCELLED,
          }) as unknown,
        }),
      );
      expect(result?.status).toBe(MembershipSubscriptionStatus.CANCELLED);
    });
  });

  describe('markMembershipPastDue', () => {
    it('updates every subscription matching the provider subscription id', async () => {
      mockPrisma.membershipSubscription.updateMany.mockResolvedValue({
        count: 1,
      });

      await markMembershipPastDue(mockPrisma as never, 'sub_1', 'evt_1');

      expect(mockPrisma.membershipSubscription.updateMany).toHaveBeenCalledWith(
        {
          where: { providerSubscriptionId: 'sub_1' },
          data: {
            status: MembershipSubscriptionStatus.PAST_DUE,
            lastWebhookEventId: 'evt_1',
          },
        },
      );
    });
  });
});
