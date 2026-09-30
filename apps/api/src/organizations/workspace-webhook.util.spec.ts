import { MembershipSubscriptionStatus } from '@prisma/client';
import {
  activateInstitutionSubscription,
  activateOrganizationSubscription,
  cancelInstitutionSubscriptionByProviderSubscriptionId,
  cancelOrganizationSubscriptionByProviderSubscriptionId,
  grantInstitutionEntitlements,
  grantOrganizationEntitlements,
  markInstitutionPastDue,
  markOrganizationPastDue,
  revokeInstitutionEntitlements,
  revokeOrganizationEntitlements,
} from './workspace-webhook.util';

describe('workspace-webhook.util', () => {
  const mockPrisma = {
    entitlement: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    entitlementGrant: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    organizationSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    institutionSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockEntitlementsService = { grant: jest.fn(), revoke: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('grantOrganizationEntitlements', () => {
    it('grants each catalog-matched key to the organization, not a user', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      await grantOrganizationEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'os-1',
          organizationId: 'org-1',
          plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
        } as never,
      );

      expect(mockEntitlementsService.grant).toHaveBeenCalledWith({
        entitlementKey: 'ENTITLEMENT_A',
        organizationId: 'org-1',
        source: 'ORGANIZATION_PLAN',
        sourceId: 'os-1',
      });
    });

    it('is idempotent under webhook retry', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue({
        id: 'grant-1',
      });

      await grantOrganizationEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'os-1',
          organizationId: 'org-1',
          plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
        } as never,
      );

      expect(mockEntitlementsService.grant).not.toHaveBeenCalled();
    });
  });

  describe('revokeOrganizationEntitlements', () => {
    it('revokes every active grant sourced from this organization subscription', async () => {
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([
        { id: 'grant-1' },
      ]);
      await revokeOrganizationEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        'os-1',
      );
      expect(mockPrisma.entitlementGrant.findMany).toHaveBeenCalledWith({
        where: {
          source: 'ORGANIZATION_PLAN',
          sourceId: 'os-1',
          revokedAt: null,
        },
      });
      expect(mockEntitlementsService.revoke).toHaveBeenCalledWith('grant-1');
    });
  });

  describe('activateOrganizationSubscription', () => {
    it('marks ACTIVE, stores provider identifiers, and grants entitlements', async () => {
      mockPrisma.organizationSubscription.update.mockResolvedValue({
        id: 'os-1',
        organizationId: 'org-1',
        plan: { entitlementKeys: JSON.stringify([]) },
      });

      const result = await activateOrganizationSubscription(
        mockPrisma as never,
        mockEntitlementsService as never,
        'os-1',
        {
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          eventId: 'evt_1',
        },
      );

      expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith({
        where: { id: 'os-1' },
        data: {
          status: MembershipSubscriptionStatus.ACTIVE,
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          lastWebhookEventId: 'evt_1',
        },
        include: { plan: true },
      });
      expect(result.id).toBe('os-1');
    });
  });

  describe('cancelOrganizationSubscriptionByProviderSubscriptionId', () => {
    it('returns null when no subscription matches', async () => {
      mockPrisma.organizationSubscription.findUnique.mockResolvedValue(null);
      const result =
        await cancelOrganizationSubscriptionByProviderSubscriptionId(
          mockPrisma as never,
          mockEntitlementsService as never,
          'sub_ghost',
          'evt_1',
        );
      expect(result).toBeNull();
      expect(mockPrisma.organizationSubscription.update).not.toHaveBeenCalled();
    });

    it('marks CANCELLED and revokes entitlements when a match exists', async () => {
      mockPrisma.organizationSubscription.findUnique.mockResolvedValue({
        id: 'os-1',
      });
      mockPrisma.organizationSubscription.update.mockResolvedValue({
        id: 'os-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);

      const result =
        await cancelOrganizationSubscriptionByProviderSubscriptionId(
          mockPrisma as never,
          mockEntitlementsService as never,
          'sub_1',
          'evt_1',
        );

      expect(result?.status).toBe(MembershipSubscriptionStatus.CANCELLED);
    });
  });

  describe('markOrganizationPastDue', () => {
    it('updates every subscription matching the provider subscription id', async () => {
      mockPrisma.organizationSubscription.updateMany.mockResolvedValue({
        count: 1,
      });
      await markOrganizationPastDue(mockPrisma as never, 'sub_1', 'evt_1');
      expect(
        mockPrisma.organizationSubscription.updateMany,
      ).toHaveBeenCalledWith({
        where: { providerSubscriptionId: 'sub_1' },
        data: {
          status: MembershipSubscriptionStatus.PAST_DUE,
          lastWebhookEventId: 'evt_1',
        },
      });
    });
  });

  // ── Institution — same shape, institutionId instead of organizationId ────

  describe('grantInstitutionEntitlements', () => {
    it('grants each catalog-matched key to the institution, not a user', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        id: 'ent-1',
        key: 'ENTITLEMENT_A',
      });
      mockPrisma.entitlementGrant.findFirst.mockResolvedValue(null);

      await grantInstitutionEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        {
          id: 'is-1',
          institutionId: 'inst-1',
          plan: { entitlementKeys: JSON.stringify(['ENTITLEMENT_A']) },
        } as never,
      );

      expect(mockEntitlementsService.grant).toHaveBeenCalledWith({
        entitlementKey: 'ENTITLEMENT_A',
        institutionId: 'inst-1',
        source: 'INSTITUTION_PLAN',
        sourceId: 'is-1',
      });
    });
  });

  describe('revokeInstitutionEntitlements', () => {
    it('revokes every active grant sourced from this institution subscription', async () => {
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([
        { id: 'grant-1' },
      ]);
      await revokeInstitutionEntitlements(
        mockPrisma as never,
        mockEntitlementsService as never,
        'is-1',
      );
      expect(mockPrisma.entitlementGrant.findMany).toHaveBeenCalledWith({
        where: {
          source: 'INSTITUTION_PLAN',
          sourceId: 'is-1',
          revokedAt: null,
        },
      });
      expect(mockEntitlementsService.revoke).toHaveBeenCalledWith('grant-1');
    });
  });

  describe('activateInstitutionSubscription', () => {
    it('marks ACTIVE, stores provider identifiers, and grants entitlements', async () => {
      mockPrisma.institutionSubscription.update.mockResolvedValue({
        id: 'is-1',
        institutionId: 'inst-1',
        plan: { entitlementKeys: JSON.stringify([]) },
      });

      const result = await activateInstitutionSubscription(
        mockPrisma as never,
        mockEntitlementsService as never,
        'is-1',
        {
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          eventId: 'evt_1',
        },
      );

      expect(mockPrisma.institutionSubscription.update).toHaveBeenCalledWith({
        where: { id: 'is-1' },
        data: {
          status: MembershipSubscriptionStatus.ACTIVE,
          providerSubscriptionId: 'sub_1',
          providerCustomerId: 'cus_1',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          lastWebhookEventId: 'evt_1',
        },
        include: { plan: true },
      });
      expect(result.id).toBe('is-1');
    });
  });

  describe('cancelInstitutionSubscriptionByProviderSubscriptionId', () => {
    it('returns null when no subscription matches', async () => {
      mockPrisma.institutionSubscription.findUnique.mockResolvedValue(null);
      const result =
        await cancelInstitutionSubscriptionByProviderSubscriptionId(
          mockPrisma as never,
          mockEntitlementsService as never,
          'sub_ghost',
          'evt_1',
        );
      expect(result).toBeNull();
    });

    it('marks CANCELLED and revokes entitlements when a match exists', async () => {
      mockPrisma.institutionSubscription.findUnique.mockResolvedValue({
        id: 'is-1',
      });
      mockPrisma.institutionSubscription.update.mockResolvedValue({
        id: 'is-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });
      mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);

      const result =
        await cancelInstitutionSubscriptionByProviderSubscriptionId(
          mockPrisma as never,
          mockEntitlementsService as never,
          'sub_1',
          'evt_1',
        );

      expect(result?.status).toBe(MembershipSubscriptionStatus.CANCELLED);
    });
  });

  describe('markInstitutionPastDue', () => {
    it('updates every subscription matching the provider subscription id', async () => {
      mockPrisma.institutionSubscription.updateMany.mockResolvedValue({
        count: 1,
      });
      await markInstitutionPastDue(mockPrisma as never, 'sub_1', 'evt_1');
      expect(
        mockPrisma.institutionSubscription.updateMany,
      ).toHaveBeenCalledWith({
        where: { providerSubscriptionId: 'sub_1' },
        data: {
          status: MembershipSubscriptionStatus.PAST_DUE,
          lastWebhookEventId: 'evt_1',
        },
      });
    });
  });
});
