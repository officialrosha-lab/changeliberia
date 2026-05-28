import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Analytics Service Unit Tests
 * Tests conversion funnel analysis, metrics calculation, and dashboard generation
 */
describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-04-17'),
    signatures: [
      { id: 'sig-1', userId: 'user-1' },
      { id: 'sig-2', userId: 'user-2' },
      { id: 'sig-3', userId: 'user-3' },
    ],
    donations: [
      { id: 'don-1', amount: 50 },
      { id: 'don-2', amount: 100 },
    ],
  };

  const mockUser = {
    id: 'user-1',
    fullName: 'John Doe',
    petitionsCreated: [{ id: 'petition-1' }],
    signatures: [{ id: 'sig-1' }, { id: 'sig-2' }],
    donations: [{ id: 'don-1', amount: 50 }],
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            facebookPixelEvent: {
              count: jest.fn().mockResolvedValue(0) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              findFirst: jest.fn().mockResolvedValue(null) as any,
            },
            petition: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              count: jest.fn().mockResolvedValue(0) as any,
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
            },
            signature: {
              count: jest.fn().mockResolvedValue(0) as any,
            },
            donation: {
              findMany: jest.fn().mockResolvedValue([]) as any,
              count: jest.fn().mockResolvedValue(0) as any,
            },
            shareCompletion: {
              findMany: jest.fn().mockResolvedValue([]) as any,
              count: jest.fn().mockResolvedValue(0) as any,
            },
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<AnalyticsService>(AnalyticsService);
    prisma = moduleFixture.get(PrismaService) as any;
  });

  describe('Conversion Funnel Analysis', () => {
    it('should calculate conversion funnel correctly', async () => {
      prisma.facebookPixelEvent.count
        .mockResolvedValueOnce(100) // views
        .mockResolvedValueOnce(20) // signups
        .mockResolvedValueOnce(10) // shares
        .mockResolvedValueOnce(5); // donations

      const funnel = await service.getConversionFunnel('petition-1');

      expect(funnel.views).toBe(100);
      expect(funnel.signups).toBe(20);
      expect(funnel.shares).toBe(10);
      expect(funnel.donations).toBe(5);
      expect(funnel.viewToSignupRate).toBe(20);
      expect(funnel.viewToShareRate).toBe(10);
      expect(funnel.viewToDonationRate).toBe(5);
    });

    it('should handle zero views in conversion funnel', async () => {
      prisma.facebookPixelEvent.count.mockResolvedValue(0);

      const funnel = await service.getConversionFunnel('petition-1');

      expect(funnel.views).toBe(0);
      expect(funnel.viewToSignupRate).toBe(0);
      expect(funnel.viewToShareRate).toBe(0);
      expect(funnel.viewToDonationRate).toBe(0);
    });

    it('should respect date range filters', async () => {
      const startDate = new Date('2026-04-01');
      const endDate = new Date('2026-04-17');

      prisma.facebookPixelEvent.count.mockResolvedValue(50);

      await service.getConversionFunnel('petition-1', startDate, endDate);

      expect(prisma.facebookPixelEvent.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            petitionId: 'petition-1',
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });
  });

  describe('Petition Metrics', () => {
    it('should get comprehensive petition metrics', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.facebookPixelEvent.count
        .mockResolvedValueOnce(100) // views
        .mockResolvedValueOnce(20) // signups
        .mockResolvedValueOnce(10); // shares

      const metrics = await service.getPetitionMetrics('petition-1');

      expect(metrics.petitionId).toBe('petition-1');
      expect(metrics.title).toBe('Test Petition');
      expect(metrics.totalSignatures).toBe(3);
      expect(metrics.totalDonations).toBe(2);
      expect(metrics.totalDonationAmount).toBe(150);
      expect(metrics.engagementScore).toBeGreaterThan(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should throw error for non-existent petition', async () => {
      prisma.petition.findUnique.mockResolvedValue(null);

      await expect(service.getPetitionMetrics('invalid')).rejects.toThrow();
    });

    it('should calculate engagement score correctly', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.facebookPixelEvent.count
        .mockResolvedValueOnce(100) // views
        .mockResolvedValueOnce(50) // signups (50%)
        .mockResolvedValueOnce(30); // shares (30%)

      const metrics = await service.getPetitionMetrics('petition-1');

      // Score = (50 * 0.5) + (30 * 0.3) + (2 * 0.2) = 25 + 9 + 0.4 = 34.4
      expect(metrics.engagementScore).toBeCloseTo(34.4, 1);
    });
  });

  describe('User Engagement Metrics', () => {
    it('should get user engagement metrics', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.shareCompletion.count.mockResolvedValue(5);
      prisma.facebookPixelEvent.findFirst.mockResolvedValue({
        createdAt: new Date(),
      } as any);

      const metrics = await service.getUserEngagementMetrics('user-1');

      expect(metrics.userId).toBe('user-1');
      expect(metrics.name).toBe('John Doe');
      expect(metrics.petitionsCreated).toBe(1);
      expect(metrics.petitionsSupported).toBe(2);
      expect(metrics.shareCount).toBe(5);
      expect(metrics.donationCount).toBe(1);
      expect(metrics.totalDonated).toBe(50);
    });

    it('should calculate engagement level', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        fullName: 'Active User',
        petitionsCreated: [{ id: '1' }, { id: '2' }],
        signatures: Array(10).fill({ id: 'sig' }),
        donations: Array(5).fill({ id: 'don', amount: 50 }),
        updatedAt: new Date(),
      } as any);

      prisma.shareCompletion.count.mockResolvedValue(8);
      prisma.facebookPixelEvent.findFirst.mockResolvedValue({
        createdAt: new Date(),
      } as any);

      const metrics = await service.getUserEngagementMetrics('user-1');

      // Score = (2 * 3) + (10 * 2) + (8 * 1.5) + (5 * 2) = 6 + 20 + 12 + 10 = 48
      // 48 >= 20 => 'very-high'
      expect(metrics.engagementLevel).toBe('very-high');
    });

    it('should throw error for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserEngagementMetrics('invalid')).rejects.toThrow();
    });
  });

  describe('Share Analytics', () => {
    it('should get share metrics', async () => {
      prisma.facebookPixelEvent.findMany.mockResolvedValue([
        { userId: 'user-1', method: 'dialog' },
        { userId: 'user-2', method: 'dialog' },
        { userId: 'user-1', method: 'native' },
      ] as any);

      prisma.shareCompletion.findMany.mockResolvedValue([
        { method: 'dialog' },
        { method: 'dialog' },
        { method: 'native' },
      ] as any);

      prisma.signature.count.mockResolvedValue(2);

      const metrics = await service.getShareMetrics('petition-1');

      expect(metrics.totalShares).toBe(3);
      expect(metrics.uniqueSharers).toBe(2);
      expect(metrics.sharesByMethod['dialog']).toBe(2);
      expect(metrics.sharesByMethod['native']).toBe(1);
    });

    it('should calculate share conversion rate', async () => {
      prisma.facebookPixelEvent.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ] as any);

      prisma.shareCompletion.findMany.mockResolvedValue([
        { method: 'dialog' },
        { method: 'dialog' },
      ] as any);

      prisma.signature.count.mockResolvedValue(1);

      const metrics = await service.getShareMetrics('petition-1');

      expect(metrics.conversionFromShares).toBe(50);
    });
  });

  describe('Donation Analytics', () => {
    it('should get comprehensive donation metrics', async () => {
      const donations = [
        { amount: 50, userId: 'user-1', petition: { id: 'pet-1', title: 'Petition 1' } },
        { amount: 100, userId: 'user-2', petition: { id: 'pet-1', title: 'Petition 1' } },
        { amount: 25, userId: 'user-1', petition: { id: 'pet-2', title: 'Petition 2' } },
      ];

      prisma.donation.findMany.mockResolvedValue(donations as any);

      const metrics = await service.getDonationMetrics();

      expect(metrics.totalDonations).toBe(3);
      expect(metrics.totalAmount).toBe(175);
      expect(metrics.averageAmount).toBe(175 / 3);
      expect(metrics.donorCount).toBe(2);
      expect(metrics.repeatDonorRate).toBe(50); // 1 out of 2
    });

    it('should identify repeat donors', async () => {
      const donations = [
        { amount: 50, userId: 'user-1', donation: { id: 'don-1' } },
        { amount: 100, userId: 'user-1', donation: { id: 'don-2' } }, // Repeat
        { amount: 25, userId: 'user-2', donation: { id: 'don-3' } },
      ];

      prisma.donation.findMany.mockResolvedValue(donations as any);

      const metrics = await service.getDonationMetrics();

      expect(metrics.donorCount).toBe(2);
      expect(metrics.repeatDonorRate).toBeGreaterThan(0);
    });

    it('should filter donations by petition', async () => {
      prisma.donation.findMany.mockResolvedValue([] as any);

      await service.getDonationMetrics('petition-1');

      expect(prisma.donation.findMany).toHaveBeenCalledWith({
        where: { petitionId: 'petition-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('Dashboard Overview', () => {
    it('should generate dashboard overview', async () => {
      prisma.petition.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(30); // active

      prisma.signature.count.mockResolvedValue(500);
      prisma.shareCompletion.count.mockResolvedValue(200);

      prisma.petition.findMany.mockResolvedValue([mockPetition as any]);
      prisma.facebookPixelEvent.findMany.mockResolvedValue([]);

      const overview = await service.getDashboardOverview();

      expect(overview.totalPetitions).toBe(50);
      expect(overview.activePetitions).toBe(30);
      expect(overview.totalSignatures).toBe(500);
      expect(overview.totalShares).toBe(200);
      expect(overview.topPetitions).toBeDefined();
      expect(overview.recentActivity).toBeDefined();
    });

    it('should calculate average metrics correctly', async () => {
      prisma.petition.count.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
      prisma.signature.count.mockResolvedValue(100);
      prisma.shareCompletion.count.mockResolvedValue(0);
      prisma.petition.findMany.mockResolvedValue([]);
      prisma.facebookPixelEvent.findMany.mockResolvedValue([]);

      const overview = await service.getDashboardOverview();

      expect(overview.averageSignaturesPerPetition).toBe(10);
    });
  });

  describe('Audience Insights', () => {
    it('should get audience insights from pixel data', async () => {
      prisma.facebookPixelEvent.count
        .mockResolvedValueOnce(1000) // views
        .mockResolvedValueOnce(300) // engaged (Lead + Share + Purchase)
        .mockResolvedValueOnce(200) // leads
        .mockResolvedValueOnce(50); // converters

      const insights = await service.getAudienceInsights('petition-1');

      expect(insights.totalReach).toBe(1000);
      expect(insights.engaged).toBe(300);
      expect(insights.leads).toBe(200);
      expect(insights.converters).toBe(50);
      expect(insights.shareMultiplier).toBeGreaterThan(0);
      expect(insights.estimatedPotentialReach).toBeGreaterThan(1000);
    });

    it('should handle zero engagement', async () => {
      prisma.facebookPixelEvent.count.mockResolvedValue(0);

      const insights = await service.getAudienceInsights('petition-1');

      expect(insights.shareMultiplier).toBe(1);
      expect(insights.estimatedPotentialReach).toBe(0);
    });
  });

  describe('Peak Activity Analysis', () => {
    it('should identify peak activity hours', async () => {
      const now = new Date();
      const events = [
        { createdAt: new Date(now.getTime() - 1000000), userId: 'user-1' },
        { createdAt: new Date(now.getTime() - 2000000), userId: 'user-2' },
        { createdAt: new Date(now.getTime() - 3000000), userId: 'user-3' },
      ];

      prisma.facebookPixelEvent.findMany.mockResolvedValue(events as any);

      const activity = await service.getPeakActivity('petition-1', 30);

      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0]).toHaveProperty('dayOfWeek');
      expect(activity[0]).toHaveProperty('hour');
      expect(activity[0]).toHaveProperty('activityCount');
    });

    it('should respect day range filter', async () => {
      prisma.facebookPixelEvent.findMany.mockResolvedValue([]);

      await service.getPeakActivity('petition-1', 7);

      expect(prisma.facebookPixelEvent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: { gte: expect.any(Date) },
        }),
      });
    });
  });

  describe('Trending Petitions', () => {
    it('should get trending petitions', async () => {
      prisma.petition.findMany.mockResolvedValue([mockPetition as any]);
      prisma.facebookPixelEvent.count.mockResolvedValue(0);

      const petitions = await service.getTrendingPetitions(10);

      expect(petitions).toBeDefined();
      expect(petitions.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      prisma.petition.findMany.mockResolvedValue([]);
      prisma.facebookPixelEvent.count.mockResolvedValue(0);

      await service.getTrendingPetitions(5);

      expect(prisma.petition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('CSV Export', () => {
    it('should export petition analytics as CSV', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.facebookPixelEvent.count.mockResolvedValue(100);
      prisma.shareCompletion.findMany.mockResolvedValue([]);

      const csv = await service.exportPetitionAnalytics('petition-1');

      expect(csv).toContain('Petition Analytics Report');
      expect(csv).toContain('Test Petition');
      expect(csv).toContain('Engagement Metrics');
      expect(csv).toContain('Conversion Funnel');
      expect(csv).toContain('Share Analytics');
    });

    it('should include all metrics in export', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.facebookPixelEvent.count.mockResolvedValue(100);
      prisma.shareCompletion.findMany.mockResolvedValue([]);
      prisma.signature.count.mockResolvedValue(10);

      const csv = await service.exportPetitionAnalytics('petition-1');

      expect(csv).toContain('Total Views');
      expect(csv).toContain('Total Signatures');
      expect(csv).toContain('Total Donation Amount');
      expect(csv).toContain('View to Signup Rate');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prisma.petition.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.getPetitionMetrics('petition-1'),
      ).rejects.toThrow();
    });

    it('should handle missing required data', async () => {
      prisma.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.getPetitionMetrics('invalid'),
      ).rejects.toThrow('not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal conversion rates', async () => {
      prisma.facebookPixelEvent.count
        .mockResolvedValueOnce(333) // views
        .mockResolvedValueOnce(1) // signup
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const funnel = await service.getConversionFunnel('petition-1');

      expect(funnel.viewToSignupRate).toBeCloseTo(0.3, 1);
    });

    it('should handle large numbers in analytics', async () => {
      prisma.petition.count.mockResolvedValueOnce(1000000);
      prisma.petition.count.mockResolvedValueOnce(500000);
      prisma.signature.count.mockResolvedValue(50000000);
      prisma.shareCompletion.count.mockResolvedValue(5000000);
      prisma.petition.findMany.mockResolvedValue([]);
      prisma.facebookPixelEvent.findMany.mockResolvedValue([]);

      const overview = await service.getDashboardOverview();

      expect(overview.totalSignatures).toBe(50000000);
      expect(overview.averageSignaturesPerPetition).toBe(100000);
    });
  });
});
