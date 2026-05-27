import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationPreference, EmailType } from '@prisma/client';

export interface EmailPreferenceDTO {
  emailEnabled?: boolean;
  digestFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
  emailCategories?: string[];
  preferredSendTime?: string; // HH:MM format
}

@Injectable()
export class EmailPreferenceService {
  private readonly logger = new Logger(EmailPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get email preferences for a user
   * Creates default preferences if they don't exist
   */
  async getPreferences(
    userId: string,
  ): Promise<NotificationPreference> {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      try {
        prefs = await this.prisma.notificationPreference.create({
          data: {
            userId,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to create default preferences for user ${userId}:`,
          error,
        );
        // Throw the error to be caught by global error handler
        throw error;
      }
    }

    return prefs;
  }

  /**
   * Update email preferences
   */
  async updatePreferences(
    userId: string,
    updates: EmailPreferenceDTO,
  ): Promise<NotificationPreference> {
    const data: any = {};

    if (updates.emailEnabled !== undefined) {
      data.emailEnabled = updates.emailEnabled;
    }

    if (updates.digestFrequency) {
      data.digestFrequency = updates.digestFrequency;
    }

    if (updates.emailCategories) {
      data.emailCategories = JSON.stringify(updates.emailCategories);
    }

    if (updates.preferredSendTime) {
      data.preferredSendTime = updates.preferredSendTime;
    }

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Check if user can receive email of a specific type
   */
  async canSendEmail(
    userId: string,
    emailType: EmailType,
  ): Promise<{ canSend: boolean; reason?: string }> {
    const prefs = await this.getPreferences(userId);

    // Check if email is globally enabled
    if (!prefs.emailEnabled) {
      return {
        canSend: false,
        reason: 'Email notifications are disabled',
      };
    }

    // Check muted types
    try {
      const mutedTypes = JSON.parse(prefs.mutedTypes || '[]');
      if (mutedTypes.includes(emailType)) {
        return {
          canSend: false,
          reason: `${emailType} emails are muted`,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to parse muted types for user ${userId}`);
    }

    // Check digest frequency
    if (emailType === 'WEEKLY_DIGEST' && prefs.digestFrequency === 'never') {
      return {
        canSend: false,
        reason: 'Digest emails disabled',
      };
    }

    return { canSend: true };
  }

  /**
   * Check if email should be sent based on digest frequency
   */
  async shouldSendDigestEmail(userId: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    if (!prefs || !prefs.emailEnabled) {
      return false;
    }

    return prefs.digestFrequency !== 'never';
  }

  /**
   * Get all users who want to receive emails
   */
  async getUsersForEmailing(emailType?: EmailType): Promise<string[]> {
    const where: any = {
      emailEnabled: true,
      digestFrequency: { not: 'never' },
    };

    // If a specific type is requested, filter by muted types
    if (emailType) {
      // This is a simplified filter; in production, might need more complex logic
      where.mutedTypes = {
        not: {
          contains: `"${emailType}"`,
        },
      };
    }

    const prefs = await this.prisma.notificationPreference.findMany({
      where,
      select: { userId: true },
    });

    return prefs.map((p) => p.userId);
  }

  /**
   * Unsubscribe user from all emails
   */
  async unsubscribeUser(userId: string): Promise<NotificationPreference> {
    return this.updatePreferences(userId, {
      emailEnabled: false,
      digestFrequency: 'never',
    });
  }

  /**
   * Mute specific email type for user
   */
  async muteEmailType(
    userId: string,
    emailType: EmailType,
  ): Promise<NotificationPreference> {
    const prefs = await this.getPreferences(userId);
    const mutedTypes = prefs
      ? (JSON.parse(prefs.mutedTypes || '[]') as EmailType[])
      : [];

    if (!mutedTypes.includes(emailType)) {
      mutedTypes.push(emailType);
    }

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        mutedTypes: JSON.stringify(mutedTypes),
      },
      create: {
        userId,
        mutedTypes: JSON.stringify(mutedTypes),
      },
    });
  }

  /**
   * Unmute specific email type for user
   */
  async unmuteEmailType(
    userId: string,
    emailType: EmailType,
  ): Promise<NotificationPreference> {
    const prefs = await this.getPreferences(userId);
    const mutedTypes = prefs
      ? (JSON.parse(prefs.mutedTypes || '[]') as EmailType[])
      : [];

    const index = mutedTypes.indexOf(emailType);
    if (index > -1) {
      mutedTypes.splice(index, 1);
    }

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        mutedTypes: JSON.stringify(mutedTypes),
      },
      create: {
        userId,
        mutedTypes: JSON.stringify(mutedTypes),
      },
    });
  }
}
