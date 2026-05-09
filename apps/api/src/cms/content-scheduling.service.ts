import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ContentSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule a page to be published/unpublished at a specific time
   */
  async scheduleAction(
    pageId: string,
    action: 'publish' | 'unpublish' | 'update',
    scheduledFor: Date,
    createdBy: string,
  ) {
    return this.prisma.cMSSchedule.create({
      data: {
        pageId,
        action,
        scheduledFor,
        createdBy,
      },
    });
  }

  /**
   * Get all scheduled actions for a page
   */
  async getPageSchedules(pageId: string) {
    return this.prisma.cMSSchedule.findMany({
      where: { pageId },
      include: { creator: { select: { id: true, fullName: true } } },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Cancel a scheduled action
   */
  async cancelSchedule(scheduleId: string) {
    return this.prisma.cMSSchedule.delete({
      where: { id: scheduleId },
    });
  }

  /**
   * Execute scheduled actions - runs every minute
   */
  async executeScheduledActions() {
    const now = new Date();

    const schedules = await this.prisma.cMSSchedule.findMany({
      where: {
        executed: false,
        scheduledFor: { lte: now },
      },
    });

    for (const schedule of schedules) {
      try {
        if (schedule.action === 'publish') {
          await this.prisma.cMSPage.update({
            where: { id: schedule.pageId },
            data: {
              published: true,
              publishedAt: new Date(),
            },
          });
        } else if (schedule.action === 'unpublish') {
          await this.prisma.cMSPage.update({
            where: { id: schedule.pageId },
            data: {
              published: false,
            },
          });
        }

        // Mark schedule as executed
        await this.prisma.cMSSchedule.update({
          where: { id: schedule.id },
          data: {
            executed: true,
            executedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Failed to execute schedule ${schedule.id}:`, error);
      }
    }
  }

  /**
   * Get upcoming scheduled actions (next 30 days)
   */
  async getUpcomingSchedules(limit = 50) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.cMSSchedule.findMany({
      where: {
        executed: false,
        scheduledFor: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        page: { select: { id: true, title: true, slug: true } },
        creator: { select: { id: true, fullName: true } },
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit,
    });
  }
}
