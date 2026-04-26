import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacebookSDKService } from './facebook-sdk.service';

/**
 * RealPixelTrackingService
 * Handles real Facebook Pixel event tracking via Graph API
 * Integrates with Conversions API for server-side tracking
 */
@Injectable()
export class RealPixelTrackingService {
  private readonly logger = new Logger(RealPixelTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookSdk: FacebookSDKService,
  ) {}

  /**
   * Track view content event (petition page view)
   */
  async trackViewContent(
    petitionId: string,
    userId?: string,
    metadata?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{
    success: boolean;
    eventId?: string;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: { title: true },
      });

      if (!petition) {
        return { success: false };
      }

      const result = await this.facebookSdk.trackConversion(
        'ViewContent',
        {
          contentName: petition.title,
          contentType: 'petition',
          contentCategory: 'social_cause',
          value: 0,
          currency: 'USD',
          eventId: `view_${petitionId}_${Date.now()}`,
          sourceUrl: `${process.env.APP_URL}/petitions/${petitionId}`,
          email: metadata?.email,
          phone: metadata?.phone,
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          userId,
        },
        userId,
      );

      if (result.success) {
        await this.logPixelEvent('ViewContent', petitionId, userId, result.eventId);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to track view content: ${(error as any)?.message}`,
      );
      return { success: false };
    }
  }

  /**
   * Track share event (petition shared on Facebook)
   */
  async trackShare(
    petitionId: string,
    userId: string,
    shareMethod: 'dialog' | 'native' | 'other',
  ): Promise<{
    success: boolean;
    eventId?: string;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: { title: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });

      const result = await this.facebookSdk.trackConversion(
        'Share',
        {
          contentName: petition?.title || 'Petition',
          contentType: 'petition',
          contentCategory: 'social_cause',
          eventId: `share_${petitionId}_${userId}_${Date.now()}`,
          sourceUrl: `${process.env.APP_URL}/petitions/${petitionId}`,
          email: user?.email,
          firstName: user?.fullName?.split(' ')[0],
          lastName: user?.fullName?.split(' ')[1],
        },
        userId,
      );

      if (result.success) {
        await this.logPixelEvent('Share', petitionId, userId, result.eventId);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to track share: ${(error as any)?.message}`);
      return { success: false };
    }
  }

  /**
   * Track lead event (user signed petition)
   */
  async trackLead(
    petitionId: string,
    userId: string,
    metadata?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{
    success: boolean;
    eventId?: string;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: { title: true },
      });

      const result = await this.facebookSdk.trackConversion(
        'Lead',
        {
          contentName: petition?.title || 'Petition',
          contentType: 'petition',
          contentCategory: 'social_cause',
          value: 1,
          currency: 'USD',
          eventId: `lead_${petitionId}_${userId}_${Date.now()}`,
          sourceUrl: `${process.env.APP_URL}/petitions/${petitionId}`,
          email: metadata?.email,
          phone: metadata?.phone,
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
        },
        userId,
      );

      if (result.success) {
        await this.logPixelEvent('Lead', petitionId, userId, result.eventId);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to track lead: ${(error as any)?.message}`);
      return { success: false };
    }
  }

  /**
   * Track purchase event (donation made for petition)
   */
  async trackPurchase(
    petitionId: string,
    userId: string,
    amount: number,
    currency: string = 'USD',
    metadata?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{
    success: boolean;
    eventId?: string;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: { title: true },
      });

      const result = await this.facebookSdk.trackConversion(
        'Purchase',
        {
          value: amount,
          currency,
          contentName: petition?.title || 'Petition',
          contentType: 'petition',
          contentCategory: 'donation',
          eventId: `purchase_${petitionId}_${userId}_${Date.now()}`,
          sourceUrl: `${process.env.APP_URL}/petitions/${petitionId}/donate`,
          email: metadata?.email,
          phone: metadata?.phone,
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
        },
        userId,
      );

      if (result.success) {
        await this.logPixelEvent('Purchase', petitionId, userId, result.eventId);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to track purchase: ${(error as any)?.message}`,
      );
      return { success: false };
    }
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(
    eventName: string,
    petitionId: string,
    userId: string,
    eventData: Record<string, any>,
  ): Promise<{
    success: boolean;
    eventId?: string;
  }> {
    try {
      const result = await this.facebookSdk.trackConversion(
        eventName,
        {
          ...eventData,
          eventId: `${eventName.toLowerCase()}_${petitionId}_${userId}_${Date.now()}`,
        },
        userId,
      );

      if (result.success) {
        await this.logPixelEvent(eventName, petitionId, userId, result.eventId);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to track custom event: ${(error as any)?.message}`,
      );
      return { success: false };
    }
  }

  /**
   * Log pixel event to database for analytics
   */
  private async logPixelEvent(
    eventType: string,
    petitionId: string,
    userId: string | undefined,
    eventId: string | undefined,
  ): Promise<void> {
    try {
      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: eventId || `pixel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          petitionId,
          userId: userId || null,
          eventType,
          eventData: JSON.stringify({
            eventId,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to log pixel event: ${(error as any)?.message}`,
      );
    }
  }

  /**
   * Get pixel event statistics
   */
  async getPixelStats(petitionId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    conversionRate: number;
    lastEventAt: Date | null;
  }> {
    const events = await this.prisma.facebookPixelEvent.findMany({
      where: { petitionId },
    });

    const eventsByType: Record<string, number> = {};
    let conversionCount = 0;

    events.forEach((event) => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      if (['Lead', 'Purchase', 'AddToCart'].includes(event.eventType)) {
        conversionCount++;
      }
    });

    const viewCount = eventsByType['ViewContent'] || 0;

    return {
      totalEvents: events.length,
      eventsByType,
      conversionRate: viewCount > 0 ? (conversionCount / viewCount) * 100 : 0,
      lastEventAt: events.length > 0 ? events[events.length - 1].createdAt : null,
    };
  }

  /**
   * Create custom audience from pixel events
   */
  async createCustomAudience(
    audienceName: string,
    petitionId: string,
    eventType: string,
  ): Promise<{
    success: boolean;
    audienceId?: string;
    error?: string;
  }> {
    try {
      const events = await this.prisma.facebookPixelEvent.findMany({
        where: { petitionId, eventType },
        select: { userId: true },
      });

      const userIds = events
        .map((e) => e.userId)
        .filter((id): id is string => id !== null);

      if (userIds.length === 0) {
        return {
          success: false,
          error: 'No users found for audience',
        };
      }

      const audience = await this.prisma.customAudience.create({
        data: {
          name: audienceName,
          petitionId,
          audienceType: `PIXEL_${eventType}`,
          userIds: JSON.stringify(userIds.slice(0, 10000)), // Facebook limits to 10k per request
        },
      });

      this.logger.log(
        `Custom audience created: ${audience.id} (${userIds.length} users)`,
      );

      return {
        success: true,
        audienceId: audience.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create custom audience: ${(error as any)?.message}`,
      );
      return {
        success: false,
        error: (error as any)?.message,
      };
    }
  }

  /**
   * Validate pixel configuration
   */
  getPixelConfig(): {
    pixelId: string;
    appId: string;
    configured: boolean;
  } {
    return {
      pixelId: this.facebookSdk.getPixelId(),
      appId: this.facebookSdk.getAppId(),
      configured:
        !!this.facebookSdk.getPixelId() && !!this.facebookSdk.getAppId(),
    };
  }
}
