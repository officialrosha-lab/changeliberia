import { Prisma } from '@prisma/client';
import {
  CIVIC_PRINCIPLE_STATEMENT,
  MonetizationAggregatesService,
} from './monetization-aggregates.service';

const D = (n: number) => new Prisma.Decimal(n);

describe('MonetizationAggregatesService', () => {
  const mockPrisma = {
    petitionPromotion: {
      aggregate: jest.fn<Promise<unknown>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    sponsorshipPurchase: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    researchProductPurchase: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    eventRegistration: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    membershipSubscription: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    organizationSubscription: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    institutionSubscription: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    apiSubscription: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    invoice: {
      count: jest.fn<Promise<number>, [unknown]>(),
    },
    professionalServiceRequest: {
      count: jest.fn<Promise<number>, [unknown]>(),
    },
  };

  let service: MonetizationAggregatesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MonetizationAggregatesService(mockPrisma as never);

    mockPrisma.petitionPromotion.aggregate.mockResolvedValue({
      _sum: { amount: D(300) },
      _count: 6,
    });
    mockPrisma.sponsorshipPurchase.findMany.mockResolvedValue([
      { package: { priceAmount: D(500) } },
      { package: { priceAmount: D(250) } },
    ]);
    mockPrisma.researchProductPurchase.findMany.mockResolvedValue([
      { product: { priceAmount: D(20) } },
      { product: { priceAmount: D(20) } },
      { product: { priceAmount: D(15) } },
    ]);
    mockPrisma.eventRegistration.findMany.mockResolvedValue([
      { event: { priceAmount: D(10) } },
    ]);
    mockPrisma.eventRegistration.count.mockResolvedValue(7);
    mockPrisma.petitionPromotion.count.mockResolvedValue(2);
    // sponsorshipPurchase.count is called twice for two different queries
    // (active count vs. unfulfilled-but-active count) — distinguish by args
    // rather than call order, so this stays correct if the source reorders.
    mockPrisma.sponsorshipPurchase.count.mockImplementation((args: unknown) => {
      const where = (args as { where: { sponsorId?: null } }).where;
      return Promise.resolve(where.sponsorId === null ? 1 : 5);
    });
    mockPrisma.membershipSubscription.findMany.mockResolvedValue([
      { plan: { priceAmount: D(12), interval: 'MONTHLY' } },
      { plan: { priceAmount: D(120), interval: 'YEARLY' } },
    ]);
    mockPrisma.organizationSubscription.findMany.mockResolvedValue([
      { plan: { priceAmount: D(300), interval: 'QUARTERLY' } },
    ]);
    mockPrisma.institutionSubscription.findMany.mockResolvedValue([
      { plan: { priceAmount: D(1200), interval: 'YEARLY' } },
    ]);
    mockPrisma.apiSubscription.findMany.mockResolvedValue([
      { plan: { priceAmount: D(49), interval: 'MONTHLY' } },
    ]);
    mockPrisma.invoice.count.mockResolvedValue(3);
    mockPrisma.membershipSubscription.count.mockResolvedValue(1);
    mockPrisma.organizationSubscription.count.mockResolvedValue(0);
    mockPrisma.institutionSubscription.count.mockResolvedValue(0);
    mockPrisma.apiSubscription.count.mockResolvedValue(1);
    mockPrisma.professionalServiceRequest.count.mockResolvedValue(4);
  });

  describe('getSummary', () => {
    it('sums one-time revenue across promotions, sponsorships, research, and paid events', async () => {
      const summary = await service.getSummary();
      expect(summary.oneTimeRevenue).toEqual({
        petitionPromotions: 300,
        sponsorships: 750,
        researchProducts: 55,
        events: 10,
        total: 1115,
      });
    });

    it('normalizes recurring subscriptions to a monthly-equivalent run-rate', async () => {
      const summary = await service.getSummary();
      // membership: 12 (monthly) + 120/12=10 (yearly) = 22
      // organization: 300/3 = 100 (quarterly)
      // institution: 1200/12 = 100 (yearly)
      // api: 49 (monthly)
      expect(summary.recurringMonthlyRevenue).toEqual({
        memberships: 22,
        organizations: 100,
        institutions: 100,
        apiPlans: 49,
        total: 271,
      });
    });

    it('reports active/lifetime counts and items needing attention', async () => {
      const summary = await service.getSummary();
      expect(summary.activeCounts).toEqual({
        payingMembers: 2,
        payingOrganizations: 1,
        payingInstitutions: 1,
        apiSubscribers: 1,
        activeSponsorships: 5,
        activePromotions: 2,
      });
      expect(summary.lifetimeCounts).toEqual({
        promotionsPurchased: 6,
        sponsorshipsPurchased: 2,
        researchProductsSold: 3,
        paidEventRegistrations: 1,
        freeEventRegistrations: 7,
      });
      expect(summary.needsAttention).toEqual({
        draftInvoices: 3,
        pastDueSubscriptions: 2, // 1 membership + 0 + 0 + 1 api
        openServiceRequests: 4,
        unfulfilledSponsorshipPurchases: 1,
      });
    });

    it('REGRESSION: excludes PENDING/CANCELLED promotions and sponsorships from captured revenue', async () => {
      // Confirmed by inspecting the query args passed to prisma, since the
      // mocked resolvers already only ever return "captured" rows — this
      // locks in that the where clause actually filters, not just that the
      // arithmetic on whatever comes back is correct.
      await service.getSummary();
      expect(mockPrisma.petitionPromotion.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
        }),
      );
      expect(mockPrisma.sponsorshipPurchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
        }),
      );
    });

    it('REGRESSION: excludes REFUNDED and non-COMPLETED research/event purchases from revenue', async () => {
      await service.getSummary();
      expect(mockPrisma.researchProductPurchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'COMPLETED' } }),
      );
      expect(mockPrisma.eventRegistration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            purchaseStatus: 'COMPLETED',
            status: { not: 'CANCELLED' },
          }) as unknown,
        }),
      );
    });
  });

  describe('getPublicSummary', () => {
    it('CIVIC PRINCIPLE / PRIVACY: exposes only aggregate totals and counts, never operational or per-user detail', async () => {
      const publicSummary = await service.getPublicSummary();

      expect(publicSummary).toEqual({
        asOf: expect.any(String) as unknown,
        totalOneTimeRevenueCollected: 1115,
        totalRecurringMonthlyRevenue: 271,
        payingMembers: 2,
        payingOrganizations: 1,
        payingInstitutions: 1,
        lifetimePromotionsPurchased: 6,
        lifetimeSponsorshipsPurchased: 2,
        lifetimeResearchProductsSold: 3,
        lifetimePaidEventRegistrations: 1,
        civicPrinciple: CIVIC_PRINCIPLE_STATEMENT,
      });
      expect(publicSummary).not.toHaveProperty('needsAttention');
      expect(publicSummary).not.toHaveProperty('draftInvoices');
    });
  });

  describe('listAllSubscriptions', () => {
    it('tags every subscription with its product type and sorts newest first', async () => {
      mockPrisma.membershipSubscription.findMany.mockResolvedValue([
        {
          id: 'm1',
          status: 'ACTIVE',
          userId: 'u1',
          user: { fullName: 'Ama Doe', email: 'ama@example.com' },
          plan: { key: 'SUPPORTER_MONTHLY', name: 'Supporter' },
          createdAt: new Date('2026-01-01'),
          currentPeriodEnd: null,
        },
      ]);
      mockPrisma.organizationSubscription.findMany.mockResolvedValue([
        {
          id: 'o1',
          status: 'ACTIVE',
          organization: { name: 'Civic NGO' },
          plan: { key: 'ORG_TEAM_MONTHLY', name: 'Team' },
          createdAt: new Date('2026-03-01'),
          currentPeriodEnd: null,
        },
      ]);
      mockPrisma.institutionSubscription.findMany.mockResolvedValue([]);
      mockPrisma.apiSubscription.findMany.mockResolvedValue([]);

      const rows = await service.listAllSubscriptions();

      expect(rows.map((r) => r.productType)).toEqual([
        'ORGANIZATION',
        'MEMBERSHIP',
      ]);
      expect(rows[0].subject).toBe('Civic NGO');
      expect(rows[1].subject).toBe('Ama Doe');
    });

    it('falls back to email, then userId, when a user has no fullName set', async () => {
      mockPrisma.membershipSubscription.findMany.mockResolvedValue([
        {
          id: 'm1',
          status: 'ACTIVE',
          userId: 'u1',
          user: { fullName: '', email: 'ama@example.com' },
          plan: { key: 'SUPPORTER_MONTHLY', name: 'Supporter' },
          createdAt: new Date('2026-01-01'),
          currentPeriodEnd: null,
        },
      ]);
      mockPrisma.organizationSubscription.findMany.mockResolvedValue([]);
      mockPrisma.institutionSubscription.findMany.mockResolvedValue([]);
      mockPrisma.apiSubscription.findMany.mockResolvedValue([]);

      const rows = await service.listAllSubscriptions();

      expect(rows[0].subject).toBe('ama@example.com');
    });
  });
});
