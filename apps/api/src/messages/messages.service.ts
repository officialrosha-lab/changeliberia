import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, SearchMessagesDto } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create and send a message
   */
  async createMessage(dto: CreateMessageDto, senderId: string) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        subject: dto.subject,
        content: dto.content,
        category: dto.category || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Emit event for email notification
    this.eventEmitter.emit('message.created', {
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.sender.fullName,
      recipientId: message.recipientId,
      recipientEmail: message.recipient.email,
      subject: message.subject,
      content: message.content,
    });

    return message;
  }

  /**
   * Get inbox for a user with optional filtering
   */
  async getInbox(
    userId: string,
    skip: number = 0,
    take: number = 20,
    filters?: { category?: string; isRead?: boolean },
  ) {
    const where = {
      recipientId: userId,
      archivedAt: null, // Exclude archived
      ...(filters?.category && { category: filters.category }),
      ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true, updatedAt: new Date() },
    });
  }

  /**
   * Mark multiple messages as read
   */
  async markMultipleAsRead(messageIds: string[], userId: string) {
    return this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId,
      },
      data: { isRead: true, updatedAt: new Date() },
    });
  }

  /**
   * Archive a message (soft delete)
   */
  async archiveMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { archivedAt: new Date() },
    });
  }

  /**
   * Permanently delete a message
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.recipientId !== userId && message.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    dto: SearchMessagesDto,
    skip: number = 0,
    take: number = 20,
  ) {
    const where = {
      recipientId: userId,
      archivedAt: null,
      ...(dto.query && {
        OR: [
          { subject: { contains: dto.query, mode: 'insensitive' } },
          { content: { contains: dto.query, mode: 'insensitive' } },
        ],
      }),
      ...(dto.category && { category: dto.category }),
      ...(dto.startDate && { createdAt: { gte: dto.startDate } }),
      ...(dto.endDate && {
        createdAt: { lte: new Date(dto.endDate.getTime() + 86400000) }, // End of day
      }),
      ...(dto.isRead !== undefined && { isRead: dto.isRead }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
        archivedAt: null,
      },
    });
  }

  /**
   * Archive old messages (called by scheduler)
   */
  async archiveOldMessages() {
    const now = new Date();
    const readThreshold = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 180 days
    const unreadThreshold = new Date(now.getTime() - 260 * 24 * 60 * 60 * 1000); // 260 days

    const result = await this.prisma.message.updateMany({
      where: {
        archivedAt: null,
        OR: [
          {
            isRead: true,
            createdAt: { lt: readThreshold },
          },
          {
            isRead: false,
            createdAt: { lt: unreadThreshold },
          },
        ],
      },
      data: { archivedAt: now },
    });

    return {
      archivedCount: result.count,
      timestamp: now,
    };
  }

  /**
   * Get message details
   */
  async getMessageDetail(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check authorization
    if (message.recipientId !== userId && message.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    return message;
  }
}
