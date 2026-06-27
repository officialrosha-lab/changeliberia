import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface MessageMetrics {
  totalMessages: number;
  avgMessagesPerDay: number;
  messagesLastDay: number;
  messagesLastWeek: number;
  messagesLastMonth: number;
}

export interface MessageVolumeByDate {
  date: string;
  sent: number;
  received: number;
  total: number;
}

export interface MessageByCategoryMetrics {
  category: string;
  count: number;
  percentage: number;
}

export interface MessageThreadMetrics {
  totalThreads: number;
  avgReplyCount: number;
  threadsWithReplies: number;
  avgThreadDepth: number;
}

export interface MessageAnalyticsResponse {
  period: 'day' | 'week' | 'month';
  metrics: MessageMetrics;
  volumeByDate: MessageVolumeByDate[];
  byCategory: MessageByCategoryMetrics[];
  threadMetrics: MessageThreadMetrics;
  topSenders: Array<{ userId: string; userEmail: string; count: number }>;
  topReceivers: Array<{ userId: string; userEmail: string; count: number }>;
}

@Injectable()
export class MessageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive message analytics for a given period
   */
  async getMessageAnalytics(
    periodType: 'day' | 'week' | 'month' = 'week',
    endDate: Date = new Date(),
  ): Promise<MessageAnalyticsResponse> {
    const startDate = this.getStartDate(endDate, periodType);

    const [
      totalMessages,
      messagesLastDay,
      messagesLastWeek,
      messagesLastMonth,
      volumeByDate,
      byCategory,
      threadMetrics,
      topSenders,
      topReceivers,
    ] = await Promise.all([
      this.prisma.message.count(),
      this.countMessagesInPeriod(new Date(endDate.getTime() - 24 * 60 * 60 * 1000), endDate),
      this.countMessagesInPeriod(new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000), endDate),
      this.countMessagesInPeriod(new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000), endDate),
      this.getVolumeByDate(startDate, endDate),
      this.getMessagesByCategory(startDate, endDate),
      this.getThreadMetrics(startDate, endDate),
      this.getTopSenders(startDate, endDate, 5),
      this.getTopReceivers(startDate, endDate, 5),
    ]);

    const accountAge = await this.getAccountAge();
    const avgMessagesPerDay = accountAge > 0 ? totalMessages / accountAge : 0;

    return {
      period: periodType,
      metrics: {
        totalMessages,
        avgMessagesPerDay: Math.round(avgMessagesPerDay * 100) / 100,
        messagesLastDay,
        messagesLastWeek,
        messagesLastMonth,
      },
      volumeByDate,
      byCategory,
      threadMetrics,
      topSenders,
      topReceivers,
    };
  }

  /**
   * Get message count in a specific time period
   */
  private async countMessagesInPeriod(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.message.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get message volume grouped by date
   */
  private async getVolumeByDate(
    startDate: Date,
    endDate: Date,
  ): Promise<MessageVolumeByDate[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date (ISO string YYYY-MM-DD)
    const grouped: Record<string, { sent: number; received: number }> = {};

    for (const msg of messages) {
      const dateKey = msg.createdAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { sent: 0, received: 0 };
      }
      grouped[dateKey].sent += 1; // Simplified for now, would need userId context for true sent/received split
    }

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date,
        sent: data.sent,
        received: data.received,
        total: data.sent + data.received,
      }));
  }

  /**
   * Get messages grouped by category
   */
  private async getMessagesByCategory(
    startDate: Date,
    endDate: Date,
  ): Promise<MessageByCategoryMetrics[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        category: true,
      },
    });

    const grouped: Record<string, number> = {};
    for (const msg of messages) {
      const cat = msg.category || 'Uncategorized';
      grouped[cat] = (grouped[cat] || 0) + 1;
    }

    const total = Object.values(grouped).reduce((a, b) => a + b, 0);

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }));
  }

  /**
   * Get thread-related metrics
   */
  private async getThreadMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<MessageThreadMetrics> {
    const allMessages = await this.prisma.message.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        replyToId: true,
      },
    });

    // Count root messages (no replyToId)
    const rootMessages = allMessages.filter((m) => !m.replyToId);

    // For each root message, count its replies
    const threadReplyCounts: number[] = [];
    const threadDepths: number[] = [];

    for (const root of rootMessages) {
      const replies = allMessages.filter((m) => m.replyToId === root.id);
      threadReplyCounts.push(replies.length);

      // Calculate depth (max distance from root)
      const depth = this.calculateThreadDepth(root.id, allMessages);
      threadDepths.push(depth);
    }

    const avgReplyCount =
      threadReplyCounts.length > 0
        ? threadReplyCounts.reduce((a, b) => a + b, 0) / threadReplyCounts.length
        : 0;

    const avgDepth =
      threadDepths.length > 0
        ? threadDepths.reduce((a, b) => a + b, 0) / threadDepths.length
        : 0;

    return {
      totalThreads: rootMessages.length,
      avgReplyCount: Math.round(avgReplyCount * 100) / 100,
      threadsWithReplies: threadReplyCounts.filter((c) => c > 0).length,
      avgThreadDepth: Math.round(avgDepth * 100) / 100,
    };
  }

  /**
   * Calculate thread depth recursively
   */
  private calculateThreadDepth(
    messageId: string,
    allMessages: Array<{ id: string; replyToId: string | null }>,
  ): number {
    const replies = allMessages.filter((m) => m.replyToId === messageId);
    if (replies.length === 0) {
      return 1;
    }
    const maxReplyDepth = Math.max(...replies.map((r) => this.calculateThreadDepth(r.id, allMessages)));
    return 1 + maxReplyDepth;
  }

  /**
   * Get top message senders
   */
  private async getTopSenders(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<Array<{ userId: string; userEmail: string; count: number }>> {
    const results = await this.prisma.$queryRaw<Array<{ senderId: string; count: bigint }>>`
      SELECT "senderId", COUNT(*) as count
      FROM "Message"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY "senderId"
      ORDER BY COUNT(*) DESC
      LIMIT ${Prisma.raw(String(limit))}
    `;

    // Fetch user emails
    const senders = await Promise.all(
      results.map(async (r) => {
        const user = await this.prisma.user.findUnique({
          where: { id: r.senderId },
          select: { id: true, email: true },
        });
        return {
          userId: r.senderId,
          userEmail: user?.email || 'Unknown',
          count: Number(r.count),
        };
      }),
    );

    return senders;
  }

  /**
   * Get top message recipients
   */
  private async getTopReceivers(
    startDate: Date,
    endDate: Date,
    limit: number = 5,
  ): Promise<Array<{ userId: string; userEmail: string; count: number }>> {
    const results = await this.prisma.$queryRaw<Array<{ recipientId: string; count: bigint }>>`
      SELECT "recipientId", COUNT(*) as count
      FROM "Message"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY "recipientId"
      ORDER BY COUNT(*) DESC
      LIMIT ${Prisma.raw(String(limit))}
    `;

    // Fetch user emails
    const receivers = await Promise.all(
      results.map(async (r) => {
        const user = await this.prisma.user.findUnique({
          where: { id: r.recipientId },
          select: { id: true, email: true },
        });
        return {
          userId: r.recipientId,
          userEmail: user?.email || 'Unknown',
          count: Number(r.count),
        };
      }),
    );

    return receivers;
  }

  /**
   * Get account age in days
   */
  private async getAccountAge(): Promise<number> {
    const firstMessage = await this.prisma.message.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (!firstMessage) {
      return 1;
    }

    const now = new Date();
    const ageMs = now.getTime() - firstMessage.createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return Math.ceil(ageDays);
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
