import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BroadcastMetrics {
  totalBroadcasts: number;
  totalRecipients: number;
  avgRecipientsPerBroadcast: number;
  broadcastsLastDay: number;
  broadcastsLastWeek: number;
  broadcastsLastMonth: number;
}

export interface BroadcastVolumeByDate {
  date: string;
  count: number;
  totalRecipients: number;
}

export interface BroadcastByCategoryMetrics {
  category: string;
  count: number;
  percentage: number;
  totalRecipients: number;
}

export interface BroadcastDeliveryMetrics {
  totalBroadcasts: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveryRate: number; // percentage
  estimatedEngagementRate?: number; // if tracking available
}

export interface BroadcastAnalyticsResponse {
  period: 'day' | 'week' | 'month';
  metrics: BroadcastMetrics;
  volumeByDate: BroadcastVolumeByDate[];
  byCategory: BroadcastByCategoryMetrics[];
  deliveryMetrics: BroadcastDeliveryMetrics;
  topCategories: Array<{ category: string; count: number }>;
  recentBroadcasts: Array<{
    id: string;
    title: string;
    category: string;
    recipientCount: number;
    createdAt: string;
  }>;
}

@Injectable()
export class BroadcastAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive broadcast analytics for a given period
   */
  async getBroadcastAnalytics(
    periodType: 'day' | 'week' | 'month' = 'week',
    endDate: Date = new Date(),
  ): Promise<BroadcastAnalyticsResponse> {
    const startDate = this.getStartDate(endDate, periodType);

    const [
      totalBroadcasts,
      broadcastsLastDay,
      broadcastsLastWeek,
      broadcastsLastMonth,
      volumeByDate,
      byCategory,
      deliveryMetrics,
      topCategories,
      recentBroadcasts,
    ] = await Promise.all([
      this.prisma.broadcast.count(),
      this.countBroadcastsInPeriod(new Date(endDate.getTime() - 24 * 60 * 60 * 1000), endDate),
      this.countBroadcastsInPeriod(new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000), endDate),
      this.countBroadcastsInPeriod(
        new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate,
      ),
      this.getVolumeByDate(startDate, endDate),
      this.getBroadcastsByCategory(startDate, endDate),
      this.getDeliveryMetrics(startDate, endDate),
      this.getTopCategories(startDate, endDate, 5),
      this.getRecentBroadcasts(startDate, endDate, 10),
    ]);

    const totalRecipients = await this.getTotalBroadcastRecipients(startDate, endDate);
    const avgRecipientsPerBroadcast =
      totalBroadcasts > 0 ? Math.round((totalRecipients / totalBroadcasts) * 100) / 100 : 0;

    return {
      period: periodType,
      metrics: {
        totalBroadcasts,
        totalRecipients,
        avgRecipientsPerBroadcast,
        broadcastsLastDay,
        broadcastsLastWeek,
        broadcastsLastMonth,
      },
      volumeByDate,
      byCategory,
      deliveryMetrics,
      topCategories,
      recentBroadcasts,
    };
  }

  /**
   * Get broadcast count in a specific time period
   */
  private async countBroadcastsInPeriod(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.broadcast.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get total recipients of broadcasts in a period
   */
  private async getTotalBroadcastRecipients(startDate: Date, endDate: Date): Promise<number> {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        recipientCount: true,
      },
    });

    return broadcasts.reduce((sum, b) => sum + (b.recipientCount || 0), 0);
  }

  /**
   * Get broadcast volume grouped by date
   */
  private async getVolumeByDate(
    startDate: Date,
    endDate: Date,
  ): Promise<BroadcastVolumeByDate[]> {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        recipientCount: true,
      },
    });

    // Group by date (ISO string YYYY-MM-DD)
    const grouped: Record<string, { count: number; totalRecipients: number }> = {};

    for (const b of broadcasts) {
      const dateKey = b.createdAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { count: 0, totalRecipients: 0 };
      }
      grouped[dateKey].count += 1;
      grouped[dateKey].totalRecipients += b.recipientCount || 0;
    }

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date,
        count: data.count,
        totalRecipients: data.totalRecipients,
      }));
  }

  /**
   * Get broadcasts grouped by category
   */
  private async getBroadcastsByCategory(
    startDate: Date,
    endDate: Date,
  ): Promise<BroadcastByCategoryMetrics[]> {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        category: true,
        recipientCount: true,
      },
    });

    const grouped: Record<string, { count: number; totalRecipients: number }> = {};
    for (const b of broadcasts) {
      const cat = b.category || 'Uncategorized';
      if (!grouped[cat]) {
        grouped[cat] = { count: 0, totalRecipients: 0 };
      }
      grouped[cat].count += 1;
      grouped[cat].totalRecipients += b.recipientCount || 0;
    }

    const total = Object.values(grouped).reduce((a, b) => a + b.count, 0);

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([category, data]) => ({
        category,
        count: data.count,
        percentage: total > 0 ? Math.round((data.count / total) * 10000) / 100 : 0,
        totalRecipients: data.totalRecipients,
      }));
  }

  /**
   * Get delivery metrics (success/failure rates)
   */
  private async getDeliveryMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<BroadcastDeliveryMetrics> {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const totalBroadcasts = broadcasts.length;
    const successful = broadcasts.filter((b) => b.status === 'SENT').length;
    const failed = broadcasts.filter((b) => b.status === 'FAILED').length;
    const deliveryRate =
      totalBroadcasts > 0 ? Math.round((successful / totalBroadcasts) * 10000) / 100 : 0;

    return {
      totalBroadcasts,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      deliveryRate,
    };
  }

  /**
   * Get top broadcast categories
   */
  private async getTopCategories(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<Array<{ category: string; count: number }>> {
    const results = await this.prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
      SELECT category, COUNT(*) as count 
      FROM "Broadcast" 
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY category
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      category: (r.category as string | null) || 'Uncategorized',
      count: Number(r.count),
    }));
  }

  /**
   * Get recent broadcasts
   */
  private async getRecentBroadcasts(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<
    Array<{
      id: string;
      title: string;
      category: string;
      recipientCount: number;
      createdAt: string;
    }>
  > {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        category: true,
        recipientCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return broadcasts.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category || 'Uncategorized',
      recipientCount: b.recipientCount || 0,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /**
   * Calculate start date based on period type
   */
  private getStartDate(endDate: Date, periodType: 'day' | 'week' | 'month'): Date {
    const start = new Date(endDate);
    if (periodType === 'day') {
      start.setDate(start.getDate() - 1);
    } else if (periodType === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (periodType === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
    return start;
  }
}
