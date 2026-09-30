import { EntitlementScope, MembershipInterval } from '@prisma/client';
import { WorkspacePlansService } from './workspace-plans.service';

describe('WorkspacePlansService', () => {
  const mockPrisma = {
    workspacePlan: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockFeatureFlags = { isEnabled: jest.fn(), setToggle: jest.fn() };

  let service: WorkspacePlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspacePlansService(
      mockPrisma as never,
      mockFeatureFlags as never,
    );
  });

  describe('listActivePlans', () => {
    it('returns an empty list when workspace billing is disabled', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(false);
      const plans = await service.listActivePlans(
        EntitlementScope.ORGANIZATION,
      );
      expect(plans).toEqual([]);
      expect(mockPrisma.workspacePlan.findMany).not.toHaveBeenCalled();
    });

    it('lists active plans for the requested scope only', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockPrisma.workspacePlan.findMany.mockResolvedValue([{ key: 'A' }]);
      const plans = await service.listActivePlans(EntitlementScope.INSTITUTION);
      expect(plans).toEqual([{ key: 'A' }]);
      expect(mockPrisma.workspacePlan.findMany).toHaveBeenCalledWith({
        where: { scope: EntitlementScope.INSTITUTION, active: true },
        orderBy: { priceAmount: 'asc' },
      });
    });
  });

  describe('findActivePlanByKey', () => {
    it('returns null when the plan does not exist', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue(null);
      const plan = await service.findActivePlanByKey(
        'GHOST',
        EntitlementScope.ORGANIZATION,
      );
      expect(plan).toBeNull();
    });

    it('returns null when the plan is inactive', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue({
        key: 'X',
        active: false,
        scope: EntitlementScope.ORGANIZATION,
      });
      const plan = await service.findActivePlanByKey(
        'X',
        EntitlementScope.ORGANIZATION,
      );
      expect(plan).toBeNull();
    });

    it('REGRESSION: returns null when the plan belongs to a different scope — an Institution plan key must never resolve for an Organization subscribe call, or vice versa', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue({
        key: 'GOV_PLAN',
        active: true,
        scope: EntitlementScope.INSTITUTION,
      });
      const plan = await service.findActivePlanByKey(
        'GOV_PLAN',
        EntitlementScope.ORGANIZATION,
      );
      expect(plan).toBeNull();
    });

    it('returns the plan when active and scope matches', async () => {
      const stored = {
        key: 'ORG_TEAM',
        active: true,
        scope: EntitlementScope.ORGANIZATION,
      };
      mockPrisma.workspacePlan.findUnique.mockResolvedValue(stored);
      const plan = await service.findActivePlanByKey(
        'ORG_TEAM',
        EntitlementScope.ORGANIZATION,
      );
      expect(plan).toEqual(stored);
    });
  });

  describe('createPlan', () => {
    it('rejects a duplicate key', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createPlan({
          key: 'DUP',
          name: 'Dup',
          scope: EntitlementScope.ORGANIZATION,
          priceAmount: 5,
          interval: MembershipInterval.MONTHLY,
        }),
      ).rejects.toThrow('already exists');
    });

    it('serializes entitlementKeys as JSON and defaults currency to USD', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue(null);
      mockPrisma.workspacePlan.create.mockResolvedValue({});
      await service.createPlan({
        key: 'ORG_TEAM',
        name: 'Team',
        scope: EntitlementScope.ORGANIZATION,
        priceAmount: 50,
        interval: MembershipInterval.MONTHLY,
        seatLimit: 10,
        entitlementKeys: ['ENTITLEMENT_X'],
      });
      expect(mockPrisma.workspacePlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'USD',
            seatLimit: 10,
            entitlementKeys: JSON.stringify(['ENTITLEMENT_X']),
          }) as unknown,
        }),
      );
    });
  });

  describe('updatePlan', () => {
    it('throws NotFoundException for an unknown plan', async () => {
      mockPrisma.workspacePlan.findUnique.mockResolvedValue(null);
      await expect(service.updatePlan('ghost', {})).rejects.toThrow(
        'not found',
      );
    });
  });
});
