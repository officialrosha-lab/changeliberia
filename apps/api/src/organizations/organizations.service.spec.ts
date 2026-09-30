import { MembershipSubscriptionStatus, OrganizationRole } from '@prisma/client';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const mockPrisma = {
    institution: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    organization: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findUniqueOrThrow: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
    },
    organizationMembership: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    organizationSubscription: {
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

  let service: OrganizationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.entitlementGrant.findMany.mockResolvedValue([]);
    service = new OrganizationsService(
      mockPrisma as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
      mockEntitlementsService as never,
      mockWorkspacePlans as never,
      mockActivityLogger as never,
    );
  });

  describe('createOrganization', () => {
    it('creates the organization with the creator as OWNER', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null); // slug free
      mockPrisma.organization.create.mockResolvedValue({
        id: 'org-1',
        name: 'Acme',
      });

      await service.createOrganization('user-1', { name: 'Acme Watch' });

      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'Acme Watch',
          slug: 'acme-watch',
          institutionId: undefined,
          memberships: {
            create: { userId: 'user-1', role: OrganizationRole.OWNER },
          },
        },
      });
    });

    it('appends a numeric suffix when the slug is already taken', async () => {
      mockPrisma.organization.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // 'acme' taken
        .mockResolvedValueOnce(null); // 'acme-2' free
      mockPrisma.organization.create.mockResolvedValue({ id: 'org-2' });

      await service.createOrganization('user-1', { name: 'Acme' });

      expect(mockPrisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-2' }) as unknown,
        }),
      );
    });

    it('rejects linking an institution the caller does not hold', async () => {
      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'inst-1',
        holderUserId: 'someone-else',
      });
      await expect(
        service.createOrganization('user-1', {
          name: 'Gov Watch',
          institutionId: 'inst-1',
        }),
      ).rejects.toThrow('Only the institution officeholder');
    });
  });

  describe('addMember', () => {
    it('rejects a non-manager actor', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.MEMBER,
      });
      await expect(
        service.addMember('org-1', 'user-1', { email: 'a@b.com' }),
      ).rejects.toThrow('owner or admin');
    });

    it('throws NotFoundException when the invited email has no account', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.OWNER,
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.addMember('org-1', 'user-1', { email: 'nobody@example.com' }),
      ).rejects.toThrow('No existing Change Liberia account');
    });

    it('rejects adding a user who is already a member', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER }) // actor check
        .mockResolvedValueOnce({ id: 'existing-membership' }); // target already exists
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      await expect(
        service.addMember('org-1', 'user-1', { email: 'b@b.com' }),
      ).rejects.toThrow('already a member');
    });

    it('REGRESSION: rejects adding a member once the free seat limit is hit with no active subscription', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER })
        .mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null); // no active sub -> FREE_SEAT_LIMIT (5)
      mockPrisma.organizationMembership.count.mockResolvedValue(5);

      await expect(
        service.addMember('org-1', 'user-1', { email: 'b@b.com' }),
      ).rejects.toThrow('seat limit');
      expect(mockPrisma.organizationMembership.create).not.toHaveBeenCalled();
    });

    it('allows unlimited seats when the active plan has seatLimit null', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER })
        .mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue({
        plan: { seatLimit: null },
      });
      mockPrisma.organizationMembership.create.mockResolvedValue({
        role: OrganizationRole.MEMBER,
      });

      await service.addMember('org-1', 'user-1', { email: 'b@b.com' });

      expect(mockPrisma.organizationMembership.count).not.toHaveBeenCalled();
      expect(mockPrisma.organizationMembership.create).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('allows a member to remove themselves without the manage-role check', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.MEMBER }) // requireMembership(self)
        .mockResolvedValueOnce({ role: OrganizationRole.MEMBER }); // target lookup
      mockPrisma.organizationMembership.delete.mockResolvedValue({});

      await service.removeMember('org-1', 'user-1', 'user-1');

      expect(mockPrisma.organizationMembership.delete).toHaveBeenCalled();
    });

    it('REGRESSION: refuses to remove the last owner', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER }) // actor manage-role check
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER }); // target lookup
      mockPrisma.organizationMembership.count.mockResolvedValue(1);

      await expect(
        service.removeMember('org-1', 'user-1', 'user-2'),
      ).rejects.toThrow('at least one owner');
      expect(mockPrisma.organizationMembership.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('rejects a non-owner actor', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.ADMIN,
      });
      await expect(
        service.updateMemberRole(
          'org-1',
          'user-1',
          'user-2',
          OrganizationRole.ADMIN,
        ),
      ).rejects.toThrow('Only an organization owner');
    });

    it('refuses to demote the last owner', async () => {
      mockPrisma.organizationMembership.findUnique
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER })
        .mockResolvedValueOnce({ role: OrganizationRole.OWNER });
      mockPrisma.organizationMembership.count.mockResolvedValue(1);

      await expect(
        service.updateMemberRole(
          'org-1',
          'user-1',
          'user-2',
          OrganizationRole.MEMBER,
        ),
      ).rejects.toThrow('at least one owner');
    });
  });

  describe('subscribe', () => {
    const plan = {
      id: 'plan-1',
      key: 'ORG_TEAM_MONTHLY',
      name: 'Team',
      priceAmount: 50,
      currency: 'USD',
      interval: 'MONTHLY',
    };

    beforeEach(() => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.OWNER,
      });
    });

    it('throws ForbiddenException when workspace billing is disabled', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(false);
      await expect(
        service.subscribe('org-1', 'user-1', {
          planKey: 'X',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('not currently available');
    });

    it('creates a PENDING subscription and tags the checkout session', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(true);
      mockWorkspacePlans.findActivePlanByKey.mockResolvedValue(plan);
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.organization.findUniqueOrThrow.mockResolvedValue({
        id: 'org-1',
        name: 'Acme',
      });
      mockPrisma.organizationSubscription.create.mockResolvedValue({
        id: 'os-1',
      });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/cs_1',
      });

      const result = await service.subscribe('org-1', 'user-1', {
        planKey: plan.key,
        successUrl: 'https://a',
        cancelUrl: 'https://b',
      });

      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            organizationSubscriptionId: 'os-1',
            organizationId: 'org-1',
            userId: 'user-1',
            planKey: plan.key,
          },
        }),
      );
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/cs_1',
        organizationSubscriptionId: 'os-1',
      });
    });

    it('REGRESSION: deletes the just-created PENDING row when checkout session creation fails', async () => {
      mockWorkspacePlans.isEnabled.mockResolvedValue(true);
      mockWorkspacePlans.findActivePlanByKey.mockResolvedValue(plan);
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
      });
      mockPrisma.organization.findUniqueOrThrow.mockResolvedValue({
        id: 'org-1',
        name: 'Acme',
      });
      mockPrisma.organizationSubscription.create.mockResolvedValue({
        id: 'os-1',
      });
      mockStripeProvider.createCheckoutSession.mockRejectedValue(
        new Error('Payment processing is not configured on this server.'),
      );

      await expect(
        service.subscribe('org-1', 'user-1', {
          planKey: plan.key,
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('Payment processing is not configured');

      expect(mockPrisma.organizationSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'os-1' },
      });
    });
  });

  describe('cancelSubscription', () => {
    it('throws NotFoundException when there is nothing active to cancel', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.OWNER,
      });
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue(null);
      await expect(
        service.cancelSubscription('org-1', 'user-1'),
      ).rejects.toThrow('No active workspace subscription found');
    });

    it('cancels via the provider and revokes entitlements', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        role: OrganizationRole.OWNER,
      });
      mockPrisma.organizationSubscription.findFirst.mockResolvedValue({
        id: 'os-1',
        provider: 'STRIPE',
        providerSubscriptionId: 'sub_1',
      });
      mockPrisma.organizationSubscription.update.mockResolvedValue({
        id: 'os-1',
        status: MembershipSubscriptionStatus.CANCELLED,
      });

      await service.cancelSubscription('org-1', 'user-1');

      expect(mockStripeProvider.cancelSubscription).toHaveBeenCalledWith(
        'sub_1',
      );
      expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'os-1' },
          data: expect.objectContaining({
            status: MembershipSubscriptionStatus.CANCELLED,
          }) as unknown,
        }),
      );
    });
  });
});
