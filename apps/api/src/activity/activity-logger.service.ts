import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityLogInput {
  userId?: string;
  adminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  status?: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

/**
 * Activity Logger Service
 * Logs all user and admin activities for audit trail and compliance
 */
@Injectable()
export class ActivityLoggerService {
  private readonly logger = new Logger(ActivityLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an activity
   * Non-blocking: logs are created asynchronously
   */
  async log(input: ActivityLogInput): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: input.userId,
          adminId: input.adminId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          description: input.description,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          changes: input.changes,
          status: input.status || 'SUCCESS',
          errorMessage: input.errorMessage,
        },
      });
    } catch (error) {
      // Log error but don't throw - activity logging should not break the main flow
      this.logger.error(
        `Failed to log activity: ${input.action}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Log activity without awaiting
   * Use for fire-and-forget logging
   */
  logAsync(input: ActivityLogInput): void {
    // Fire and forget - don't await or catch
    this.log(input).catch((err) => {
      this.logger.error('Async activity log failed:', err);
    });
  }

  /**
   * Get activity logs with pagination and filtering
   */
  async getActivityLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
      action?: string;
      entityType?: string;
      userId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
          admin: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get activity logs for a specific user
   */
  async getUserActivityLogs(
    userId: string,
    limit: number = 50,
    filters: {
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { userId };

    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const logs = await this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  /**
   * Get activity summary statistics
   */
  async getActivityStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalActivities,
      activitiesByAction,
      activitiesByUser,
      failedActivities,
    ] = await Promise.all([
      this.prisma.activityLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where: { createdAt: { gte: startDate } },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        _count: { id: true },
        where: {
          createdAt: { gte: startDate },
          userId: { not: null },
        },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.activityLog.count({
        where: {
          createdAt: { gte: startDate },
          status: 'FAILED',
        },
      }),
    ]);

    return {
      totalActivities,
      activitiesByAction: activitiesByAction.map((a) => ({
        action: a.action,
        count: a._count.id,
      })),
      topUsers: activitiesByUser.map((u) => ({
        userId: u.userId,
        count: u._count.id,
      })),
      failedActivities,
      period: `${days} days`,
    };
  }
}
