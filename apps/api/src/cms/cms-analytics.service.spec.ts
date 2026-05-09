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

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 1,
        clicks: 0,
        variantId: undefined,
        recordDate: new Date(),
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

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        views: 5,
        clicks: 2,
        pageId: data.pageId,
        blockId: data.blockId,
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

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 1,
        clicks: 0,
        variantId: data.variantId,
        recordDate: new Date(),
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

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 0,
        clicks: 1,
        variantId: undefined,
        recordDate: new Date(),
      });

      mockPrisma.cMSBlockAnalytics.update.mockResolvedValueOnce({
        id: 'analytics-1',
        views: 0,
        clicks: 1,
      });

      const result = await service.trackBlockClick(data.pageId, data.blockId, data.blockType);

      expect(prisma.cMSBlockAnalytics.upsert).toHaveBeenCalled();
      expect(result.clicks).toBe(1);
    });

    it('should increment existing click count', async () => {
      const data = {
        pageId: 'page-1',
        blockId: 'block-1',
        blockType: 'cta',
      };

      mockPrisma.cMSBlockAnalytics.upsert.mockResolvedValueOnce({
        id: 'analytics-1',
        pageId: data.pageId,
        blockId: data.blockId,
        blockType: data.blockType,
        views: 10,
        clicks: 3,
        variantId: undefined,
        recordDate: new Date(),
      });

      mockPrisma.cMSBlockAnalytics.update.mockResolvedValueOnce({
        id: 'analytics-1',
        views: 10,
        clicks: 3,
      });

      const result = await service.trackBlockClick(data.pageId, data.blockId, data.blockType);

      expect(result.clicks).toBe(3);
    });
  });

  describe('getBlockAnalytics', () => {
    it('should return analytics for a specific block', async () => {
      const blockId = 'block-1';

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: 'analytics-1',
          blockId,
          blockType: 'hero',
          viewCount: 100,
          clickCount: 10,
          variantId: '',
          pageId: 'page-1',
        },
      ]);

      const result = await service.getBlockAnalytics(blockId);

      expect(prisma.cMSBlockAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { blockId },
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].viewCount).toBe(100);
      expect(result[0].clickCount).toBe(10);
    });

    it('should calculate engagement rate', async () => {
      const blockId = 'block-1';

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: 'analytics-1',
          blockId,
          blockType: 'hero',
          viewCount: 100,
          clickCount: 10,
          variantId: '',
          pageId: 'page-1',
        },
      ]);

      const result = await service.getBlockAnalytics(blockId);

      expect(result[0].engagementRate).toBe(0.1); // 10/100
    });
  });

  describe('getPageAnalytics', () => {
    it('should aggregate analytics for all blocks on a page', async () => {
      const pageId = 'page-1';

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([
        {
          id: 'analytics-1',
          blockId: 'block-1',
          blockType: 'hero',
          viewCount: 100,
          clickCount: 10,
          variantId: '',
          pageId,
        },
        {
          id: 'analytics-2',
          blockId: 'block-2',
          blockType: 'cta',
          viewCount: 80,
          clickCount: 8,
          variantId: '',
          pageId,
        },
      ]);

      const result = await service.getPageAnalytics(pageId);

      expect(prisma.cMSBlockAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pageId },
        })
      );

      expect(result.totalViews).toBe(180);
      expect(result.totalClicks).toBe(18);
      expect(result.avgEngagementRate).toBe(0.1); // 18/180
    });

    it('should handle empty page analytics', async () => {
      const pageId = 'page-empty';

      mockPrisma.cMSBlockAnalytics.findMany.mockResolvedValueOnce([]);

      const result = await service.getPageAnalytics(pageId);

      expect(result.totalViews).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.avgEngagementRate).toBe(0);
    });
  });

  describe('compareVariants', () => {
    it('should compare analytics across A/B test variants', async () => {
      const blockId = 'block-1';

      mockPrisma.cMSBlockAnalytics.groupBy.mockResolvedValueOnce([
        {
          variantId: 'variant-a',
          _sum: {
            viewCount: 100,
            clickCount: 15,
          },
        },
        {
          variantId: 'variant-b',
          _sum: {
            viewCount: 95,
            clickCount: 12,
          },
        },
      ]);

      const result = await service.compareVariants(blockId);

      expect(prisma.cMSBlockAnalytics.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['variantId'],
          where: { blockId },
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0].engagementRate).toBe(0.15); // 15/100
      expect(result[1].engagementRate).toBeCloseTo(0.1263, 2); // 12/95
    });

    it('should identify winning variant', async () => {
      const blockId = 'block-1';

      mockPrisma.cMSBlockAnalytics.groupBy.mockResolvedValueOnce([
        {
          variantId: 'variant-a',
          _sum: {
            viewCount: 100,
            clickCount: 20,
          },
        },
        {
          variantId: 'variant-b',
          _sum: {
            viewCount: 100,
            clickCount: 15,
          },
        },
      ]);

      const result = await service.compareVariants(blockId);

      // variant-a has higher engagement (20/100 = 0.2 vs 15/100 = 0.15)
      expect(result[0].engagementRate).toBeGreaterThan(result[1].engagementRate);
    });
  });
});
