import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Government Inbox is a virtual view over existing data — no dedicated
 * inbox table. Petitions routed to the institution and direct messages
 * to the officeholder are merged and sorted by recency.
 */
@Injectable()
export class OfficialInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async getInbox(
    institutionId: string,
    holderUserId: string,
    filters: { stage?: string; unreadOnly?: boolean } = {},
    page = 1,
    limit = 20,
  ) {
    // Bound each source to the rows needed to cover up to the requested page
    // rather than loading the full table before merging/sorting/slicing.
    const window = page * limit;

    const [responses, messages, unreadMessageCount] = await Promise.all([
      this.prisma.petitionGovernmentResponse.findMany({
        where: {
          institutionId,
          ...(filters.stage ? { currentStage: filters.stage as any } : {}),
        },
        include: {
          petition: { select: { id: true, title: true, summary: true, county: true, signaturesCount: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: window,
      }),
      this.prisma.message.findMany({
        where: {
          recipientId: holderUserId,
          ...(filters.unreadOnly ? { isRead: false } : {}),
        },
        include: { sender: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: window,
      }),
      this.getUnreadCount(holderUserId),
    ]);

    const items = [
      ...responses.map((r) => ({
        type: 'petition' as const,
        id: r.id,
        timestamp: r.updatedAt,
        stage: r.currentStage,
        petition: r.petition,
      })),
      ...messages.map((m) => ({
        type: 'message' as const,
        id: m.id,
        timestamp: m.createdAt,
        isRead: m.isRead,
        sender: m.sender,
        content: m.content,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      data: paged,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadMessageCount,
    };
  }

  /** Shared unread-count so the dashboard and inbox tab never disagree. */
  async getUnreadCount(holderUserId: string): Promise<number> {
    return this.prisma.message.count({ where: { recipientId: holderUserId, isRead: false } });
  }
}
