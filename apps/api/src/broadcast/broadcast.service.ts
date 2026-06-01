import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BroadcastService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Send a broadcast message to all members of a stakeholder group
   */
  async broadcastToGroup(
    groupId: string,
    subject: string,
    content: string,
    senderUserId: string,
    category?: string,
  ) {
    // Verify group exists
    const group = await this.prisma.petitionStakeholderGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error('Stakeholder group not found');
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: senderUserId },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    const members = group.memberships;
    const recipientCount = members.length;

    if (recipientCount === 0) {
      return {
        success: true,
        recipientCount: 0,
        failedCount: 0,
        message: 'Group has no members',
      };
    }

    // Create messages for each member
    const messagePromises = members.map((membership) =>
      this.createBroadcastMessage(
        membership.user.id,
        senderUserId,
        subject,
        content,
        category,
      ),
    );

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ recipientId: string; error: string }> = [];

    for (const promise of messagePromises) {
      try {
        await promise;
        successCount++;
      } catch (error: any) {
        failedCount++;
        const recipientId = error.recipientId || 'unknown';
        errors.push({
          recipientId,
          error: error.message,
        });
      }
    }

    // Emit broadcast event
    this.eventEmitter.emit('broadcast.sent', {
      groupId,
      groupType: group.groupType,
      petitionId: group.petitionId,
      senderId: senderUserId,
      senderName: sender?.fullName,
      senderEmail: sender?.email,
      subject,
      recipientCount,
      successCount,
      failedCount,
      timestamp: new Date(),
    });

    return {
      success: failedCount === 0,
      recipientCount,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Send a broadcast message to multiple groups (e.g., notify all stakeholders)
   */
  async broadcastToMultipleGroups(
    groupIds: string[],
    subject: string,
    content: string,
    senderUserId: string,
    category?: string,
  ) {
    const results = await Promise.all(
      groupIds.map((groupId) =>
        this.broadcastToGroup(groupId, subject, content, senderUserId, category),
      ),
    );

    const totalRecipients = results.reduce(
      (sum, r) => sum + (r.recipientCount ?? 0),
      0,
    );
    const totalSuccess = results.reduce(
      (sum, r) => sum + (r.successCount ?? 0),
      0,
    );
    const totalFailed = results.reduce(
      (sum, r) => sum + (r.failedCount ?? 0),
      0,
    );

    return {
      groupCount: groupIds.length,
      totalRecipients,
      totalSuccess,
      totalFailed,
      allSuccessful: totalFailed === 0,
      details: results,
    };
  }

  /**
   * Send a broadcast to all stakeholder groups of a petition (full petition notification)
   */
  async broadcastToPetitionStakeholders(
    petitionId: string,
    subject: string,
    content: string,
    senderUserId: string,
    excludeGroupTypes?: string[],
    category?: string,
  ) {
    // Get all groups for this petition
    const groups = await this.prisma.petitionStakeholderGroup.findMany({
      where: { petitionId },
    });

    // Filter out excluded groups
    const targetGroups = excludeGroupTypes
      ? groups.filter((g) => !excludeGroupTypes.includes(g.groupType))
      : groups;

    return this.broadcastToMultipleGroups(
      targetGroups.map((g) => g.id),
      subject,
      content,
      senderUserId,
      category,
    );
  }

  /**
   * Get broadcast history for a group
   */
  async getBroadcastHistory(
    groupId: string,
    skip: number = 0,
    take: number = 50,
  ) {
    // For now, we track broadcasts via messages with specific attributes
    // In future, could add a dedicated BroadcastLog model

    const group = await this.prisma.petitionStakeholderGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: true,
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    // Get recent messages to group members
    const memberIds = group.memberships.map((m) => m.userId);

    const messages = await this.prisma.message.findMany({
      where: {
        recipientId: { in: memberIds },
        category: 'broadcast',
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return {
      groupId,
      totalMembers: memberIds.length,
      messages,
    };
  }

  /**
   * Helper: Create a single broadcast message
   */
  private async createBroadcastMessage(
    recipientId: string,
    senderUserId: string,
    subject: string,
    content: string,
    category?: string,
  ) {
    try {
      return await this.messagesService.createMessage(
        {
          recipientId,
          subject,
          content,
          category: category || 'broadcast',
        },
        senderUserId,
      );
    } catch (error: any) {
      error.recipientId = recipientId;
      throw error;
    }
  }

  /**
   * Get broadcast stats for a petition
   */
  async getPetitionBroadcastStats(petitionId: string) {
    const groups = await this.prisma.petitionStakeholderGroup.findMany({
      where: { petitionId },
      include: {
        memberships: {
          select: { id: true },
        },
      },
    });

    return {
      petitionId,
      totalGroups: groups.length,
      groupStats: groups.map((g) => ({
        groupType: g.groupType,
        memberCount: g.memberships.length,
      })),
      totalStakeholders: groups.reduce(
        (sum, g) => sum + g.memberships.length,
        0,
      ),
    };
  }
}
