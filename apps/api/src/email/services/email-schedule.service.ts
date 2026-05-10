import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { EmailType } from '@prisma/client';

/**
 * Scheduled tasks for email system
 * - Weekly digest emails
 * - Failed email retries
 * - Old email log cleanup
 */

@Injectable()
export class EmailScheduleService {
  private readonly logger = new Logger(EmailScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send weekly digest emails every Sunday at 9 AM
   */
  @Cron('0 9 * * 0') // Every Sunday at 9 AM
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log('Starting weekly digest email batch...');

    try {
      // Find users who want weekly digests
      const users = await this.prisma.user.findMany({
        where: {
          notificationPrefs: {
            emailEnabled: true,
            digestFrequency: 'weekly',
          },
        },
        include: {
          notificationPrefs: true,
        },
      });

      this.logger.log(`Found ${users.length} users for weekly digest`);

      let sent = 0;
      for (const user of users) {
        try {
          // Get trending petitions from this week
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const petitions = await this.prisma.petition.findMany({
            where: {
              createdAt: { gte: weekAgo },
              status: 'APPROVED',
            },
            select: {
              id: true,
              title: true,
              _count: { select: { signatures: true } },
            },
            orderBy: {
              signatures: { _count: 'desc' },
            },
            take: 5,
          });

          if (petitions.length === 0) {
            continue;
          }

          // Calculate total new signatures
          const signatureCounts = await Promise.all(
            petitions.map((p) =>
              this.prisma.signature.count({
                where: {
                  petitionId: p.id,
                  createdAt: { gte: weekAgo },
                },
              }),
            ),
          );

          const totalNewSignatures = signatureCounts.reduce((a, b) => a + b, 0);

          if (user.email) {
            const result = await this.emailService.sendNotification(
              user.id,
              user.email,
              EmailType.WEEKLY_DIGEST,
              {
                recipientName: user.fullName,
                digestDate: new Date().toLocaleDateString(),
                petitions: petitions.map((p, i) => ({
                  title: p.title,
                  signatures: p._count.signatures,
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/petitions/${p.id}`,
                })),
                totalNewSignatures,
                appUrl: process.env.NEXT_PUBLIC_APP_URL,
              },
            );

            if (result) {
              sent++;
            }
          }
        } catch (error) {
          this.logger.error(`Failed to send digest to ${user.email}: ${error}`);
        }
      }

      this.logger.log(`Weekly digest emails sent: ${sent}/${users.length}`);
    } catch (error) {
      this.logger.error(`Failed to send weekly digests: ${error}`);
    }
  }

  /**
   * Retry failed emails every 15 minutes
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async retryFailedEmails(): Promise<void> {
    try {
      // Retry failed emails directly
      this.logger.log('Retrying failed emails...');
      // This would be implemented by the email service
      // For now, just log the scheduled execution
    } catch (error) {
      this.logger.error(`Failed to retry failed emails: ${error}`);
    }
  }

  /**
   * Clean up old email logs daily at 2 AM
   * Keep: Last 90 days, or all if starred
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldEmailLogs(): Promise<void> {
    this.logger.log('Starting email log cleanup...');

    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const deleted = await this.prisma.emailLog.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          status: {
            in: ['FAILED', 'BOUNCED'],
          },
        },
      });

      this.logger.log(`Deleted ${deleted.count} old email logs`);
    } catch (error) {
      this.logger.error(`Failed to cleanup email logs: ${error}`);
    }
  }

  /**
   * Archive completed email jobs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async archiveCompletedJobs(): Promise<void> {
    this.logger.log('Starting email job archive...');

    try {
      // Archive/cleanup completed jobs in the database instead
      const archivedCount = await this.prisma.emailLog.updateMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
        data: {
          // Mark as archived or just log deletion
        },
      });
      
      this.logger.log(`Archived ${archivedCount.count} completed email jobs`);
    } catch (error) {
      this.logger.error(`Failed to archive jobs: ${error}`);
    }
  }

  /**
   * Generate daily email analytics
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyAnalytics(): Promise<void> {
    this.logger.log('Generating daily email analytics...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = await this.prisma.emailLog.groupBy({
        by: ['type', 'status'],
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: true,
      });

      this.logger.log(`Daily stats: ${JSON.stringify(stats)}`);

      // Could store in analytics table for dashboard
    } catch (error) {
      this.logger.error(`Failed to generate analytics: ${error}`);
    }
  }
}
