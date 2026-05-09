import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CMSAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a block view
   */
  async trackBlockView(pageId: string, blockId: string, blockType: string, variantId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use empty string as default for variant ID if not provided
    const vid = variantId || '';

    return this.prisma.cMSBlockAnalytics.upsert({
      where: {
        pageId_blockId_variantId_recordDate: {
          pageId,
          blockId,
          variantId: vid,
          recordDate: today,
        },
      },
      update: {
        views: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        pageId,
        blockId,
        blockType,
        variantId: vid || undefined,
        views: 1,
        clicks: 0,
        recordDate: today,
      },
    });
  }

  /**
   * Track a block click (CTA, button, etc)
   */
  async trackBlockClick(pageId: string, blockId: string, blockType: string, variantId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use empty string as default for variant ID if not provided
    const vid = variantId || '';

    const analytics = await this.prisma.cMSBlockAnalytics.upsert({
      where: {
        pageId_blockId_variantId_recordDate: {
          pageId,
          blockId,
          variantId: vid,
          recordDate: today,
        },
      },
      update: {
        clicks: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        pageId,
        blockId,
        blockType,
        variantId: vid || undefined,
        views: 0,
        clicks: 1,
        recordDate: today,
      },
    });

    // Recalculate engagement rate
    if (analytics.views > 0) {
      const engagement = analytics.clicks / analytics.views;
      await this.prisma.cMSBlockAnalytics.update({
        where: { id: analytics.id },
        data: { engagement },
      });
    }

    return analytics;
  }

  /**
   * Get analytics for a block over a date range
   */
  async getBlockAnalytics(
    blockId: string,
    startDate: Date,
    endDate: Date,
    includeVariants = false,
  ) {
    const analytics = await this.prisma.cMSBlockAnalytics.findMany({
      where: {
        blockId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(includeVariants ? {} : { variantId: null }),
      },
      orderBy: { recordDate: 'asc' },
    });

    // Calculate totals and averages
    const totals = {
      views: analytics.reduce((sum, a) => sum + a.views, 0),
      clicks: analytics.reduce((sum, a) => sum + a.clicks, 0),
      avgEngagement: 0,
    };

    if (totals.views > 0) {
      totals.avgEngagement = totals.clicks / totals.views;
    }

    return { analytics, totals };
  }

  /**
   * Get page-level analytics
   */
  async getPageAnalytics(pageId: string, startDate: Date, endDate: Date) {
    const analytics = await this.prisma.cMSBlockAnalytics.findMany({
      where: {
        pageId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { recordDate: 'asc' },
    });

    // Group by block and calculate stats
    const blockStats: Record<string, any> = {};

    for (const record of analytics) {
      if (!blockStats[record.blockId]) {
        blockStats[record.blockId] = {
          blockId: record.blockId,
          blockType: record.blockType,
          views: 0,
          clicks: 0,
          engagement: 0,
        };
      }

      blockStats[record.blockId].views += record.views;
      blockStats[record.blockId].clicks += record.clicks;
    }

    // Calculate engagement rates
    for (const blockId in blockStats) {
      if (blockStats[blockId].views > 0) {
        blockStats[blockId].engagement = blockStats[blockId].clicks / blockStats[blockId].views;
      }
    }

    const totals = {
      views: Object.values(blockStats).reduce((sum: number, b: any) => sum + b.views, 0),
      clicks: Object.values(blockStats).reduce((sum: number, b: any) => sum + b.clicks, 0),
      avgEngagement: 0,
    };

    if (totals.views > 0) {
      totals.avgEngagement = totals.clicks / totals.views;
    }

    return {
      pageId,
      blocks: Object.values(blockStats),
      totals,
    };
  }

  /**
   * Compare variant performance for A/B testing
   */
  async compareVariants(blockId: string, variantIds: string[], startDate: Date, endDate: Date) {
    const results: Record<string, any> = {};

    for (const variantId of variantIds) {
      const analytics = await this.prisma.cMSBlockAnalytics.findMany({
        where: {
          blockId,
          variantId,
          recordDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totals = {
        views: analytics.reduce((sum, a) => sum + a.views, 0),
        clicks: analytics.reduce((sum, a) => sum + a.clicks, 0),
        engagement: 0,
      };

      if (totals.views > 0) {
        totals.engagement = totals.clicks / totals.views;
      }

      results[variantId] = totals;
    }

    // Determine winner (highest engagement)
    let winner = variantIds[0];
    let maxEngagement = 0;

    for (const variantId of variantIds) {
      const engagement = (results[variantId] as any).engagement;
      if (engagement > maxEngagement) {
        maxEngagement = engagement;
        winner = variantId;
      }
    }

    return {
      blockId,
      results,
      winner,
      startDate,
      endDate,
    };
  }
}
