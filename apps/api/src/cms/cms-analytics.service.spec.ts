import { Test, TestingModule } from '@nestjs/testing';
import { CMSAnalyticsService } from './cms-analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CMSAnalyticsService', () => {
  let module: TestingModule;
  let service: CMSAnalyticsService;
  let prisma: PrismaService;

  const mockPrisma = {
    cMSBlockAnalytics: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CMSAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CMSAnalyticsService>(CMSAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('trackBlockView', () => {
    it('should track a new block view', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'hero',
      };

      const now = new Date();

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 1,
        clicks: 0,
        engagement: 0,
        variantId: undefined,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.trackBlockView(data.pageId, data.blockId, data.blockType);

      expect(prisma.cMSBlockAnalytics.upsert).toHaveBeenCalled();
      expect(result.views).toBe(1);
      expect(result.clicks).toBe(0);
    });

    it('should increment existing view count', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'hero',
      };

      const now = new Date();

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        views: 5,
        clicks: 2,
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        variantId: undefined,
        engagement: 0.4,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.trackBlockView(data.pageId, data.blockId, data.blockType);

      expect(result.views).toBe(5);
    });

    it('should handle variant tracking', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'hero',
        variantId: 'variant-a',
      };

      const now = new Date();

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 1,
        clicks: 0,
        variantId: data.variantId,
        engagement: 0,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.trackBlockView(data.pageId, data.blockId, data.blockType, data.variantId);

      expect(result.variantId).toBe('variant-a');
    });
  });

  describe('trackBlockClick', () => {
    it('should track a block click event', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'cta',
      };

      const now = new Date();

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 0,
        clicks: 1,
        variantId: undefined,
        engagement: 0,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      mockPrisma.cMSBlockAnalytics.update.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 0,
        clicks: 1,
        variantId: undefined,
        engagement: 0,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.trackBlockClick(data.pageId, data.blockId, data.blockType);

      expect(prisma.cMSBlockAnalytics.upsert).toHaveBeenCalled();
      expect(result.clicks).toBe(1);
    });

    it('should calculate engagement rate on click', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'cta',
      };

      const now = new Date();

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 10,
        clicks: 3,
        variantId: undefined,
        engagement: 0.3,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      mockPrisma.cMSBlockAnalytics.update.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 10,
        clicks: 3,
        variantId: undefined,
        engagement: 0.3,
        recordDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.trackBlockClick(data.pageId, data.blockId, data.blockType);

      expect(result.clicks).toBe(3);
      expect(prisma.cMSBlockAnalytics.update).toHaveBeenCalled();
    });
  });

  describe('getPageAnalytics', () => {
    it('should return aggregated page analytics', async () => {
      const pageId = 'page-1';
      const now = new Date();

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: '1',
          pageId,
          blockId: 'block-1',
          blockType: 'hero',
          variantId: null,
          views: 100,
          clicks: 10,
          engagement: 0.1,
          recordDate: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          pageId,
          blockId: 'block-2',
          blockType: 'cta',
          variantId: null,
          views: 50,
          clicks: 5,
          engagement: 0.1,
          recordDate: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.getPageAnalytics(pageId, now, now);

      expect(result.pageId).toBe(pageId);
      expect(result.blocks).toHaveLength(2);
      expect(result.totals.views).toBe(150);
      expect(result.totals.clicks).toBe(15);
      expect(result.totals.avgEngagement).toBe(0.1);
    });

    it('should handle pages with no analytics', async () => {
      const pageId = 'page-empty';
      const now = new Date();

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([]);

      const result = await service.getPageAnalytics(pageId, now, now);

      expect(result.pageId).toBe(pageId);
      expect(result.blocks).toHaveLength(0);
      expect(result.totals.views).toBe(0);
      expect(result.totals.clicks).toBe(0);
      expect(result.totals.avgEngagement).toBe(0);
    });
  });

  describe('compareVariants', () => {
    it('should compare two variants and identify winner', async () => {
      const blockId = 'block-1';
      const variantA = 'variant-a';
      const variantB = 'variant-b';
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Mock first call for variant-a
      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: '1',
          blockId,
          blockType: 'hero',
          variantId: variantA,
          views: 100,
          clicks: 15,
          engagement: 0.15,
          pageId: 'page-1',
          recordDate: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // Mock second call for variant-b
      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: '2',
          blockId,
          blockType: 'hero',
          variantId: variantB,
          views: 95,
          clicks: 12,
          engagement: 0.126,
          pageId: 'page-1',
          recordDate: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.compareVariants(blockId, [variantA, variantB], startDate, now);

      expect(result.blockId).toBe(blockId);
      expect(result.winner).toBe(variantA);
      expect(result.results[variantA].engagement).toBe(0.15);
      expect(result.results[variantB].engagement).toBeCloseTo(0.126, 2);
    });
  });
});
