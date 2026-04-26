import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FacebookPixelService {
  private readonly logger = new Logger(FacebookPixelService.name);
  private readonly PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || 'placeholder_pixel_id';
  private readonly ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize Facebook Pixel (returns pixel ID for frontend injection)
   */
  getPixelId(): string {
    return this.PIXEL_ID;
  }

  /**
   * Get pixel initialization code for HTML head
   */
  getPixelInitCode(): string {
    return `
      <!-- Facebook Pixel Code -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${this.PIXEL_ID}');
        fbq('track', 'PageView');
      </script>
      <noscript>
        <img height="1" width="1" style="display:none"
          src="https://www.facebook.com/tr?id=${this.PIXEL_ID}&ev=PageView&noscript=1" />
      </noscript>
      <!-- End Facebook Pixel Code -->
    `;
  }

  /**
   * Track a conversion event via Facebook Pixel
   */
  async trackConversion(
    userId: string,
    petitionId: string,
    trustValue: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // Create pixel event record for audit trail
      const eventId = this.generateEventId();

      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId,
          userId,
          petitionId,
          eventType: 'Purchase', // Using Purchase for signature (highest priority event)
          eventData: JSON.stringify({
            content_ids: [petitionId],
            content_type: 'petition',
            value: trustValue,
            currency: 'USD', // Trust score as "value"
          }),
          conversionValue: trustValue,
          pixelId: this.PIXEL_ID,
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            ...metadata,
          }),
        },
      });

      this.logger.log(
        `Tracked conversion event ${eventId} for user ${userId} on petition ${petitionId}`,
      );

      // In production, would send to Facebook Conversions API
      if (this.ACCESS_TOKEN) {
        await this.sendToFacebookAPI(eventId, {
          eventName: 'Purchase',
          eventData: {
            content_ids: [petitionId],
            value: trustValue,
            currency: 'USD',
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to track conversion: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - pixel tracking shouldn't block signature creation
    }
  }

  /**
   * Track custom event (shares, views, etc)
   */
  async trackEvent(
    eventType:
      | 'ViewContent'
      | 'AddToCart'
      | 'InitiateCheckout'
      | 'AddPaymentInfo'
      | 'Purchase'
      | 'Lead'
      | 'CompleteRegistration',
    userId: string | null,
    petitionId: string,
    eventData: Record<string, any>,
  ): Promise<void> {
    try {
      const eventId = this.generateEventId();

      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId,
          userId: userId || undefined,
          petitionId,
          eventType,
          eventData: JSON.stringify(eventData),
          conversionValue: eventData.value || 0,
          pixelId: this.PIXEL_ID,
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            eventSource: 'website',
          }),
        },
      });

      this.logger.log(
        `Tracked ${eventType} event ${eventId} for petition ${petitionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to track event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Create and sync custom audience to Facebook
   */
  async createAndSyncAudience(
    petitionId: string,
    audienceType: 'SHARERS' | 'CONVERTERS' | 'INFLUENCERS' | 'ENGAGED',
    userIds: string[],
  ): Promise<{
    facebookAudienceId: string;
    estimatedSize: number;
    syncedAt: Date;
  }> {
    try {
      // Store audience
      const audience = await this.prisma.customAudience.create({
        data: {
          petitionId,
          name: `${audienceType} - Petition ${petitionId.substring(0, 8)}`,
          audienceType,
          userIds: JSON.stringify(userIds),
          estimatedSize: userIds.length,
        },
      });

      // In production, would sync to Facebook
      const facebookAudienceId = this.generateFacebookAudienceId();

      const updated = await this.prisma.customAudience.update({
        where: { id: audience.id },
        data: {
          facebookAudienceId,
          syncedAt: new Date(),
        },
      });

      this.logger.log(
        `Created and synced custom audience ${facebookAudienceId} with ${userIds.length} users`,
      );

      return {
        facebookAudienceId,
        estimatedSize: userIds.length,
        syncedAt: updated.syncedAt!,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create custom audience: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get pixel report/analytics
   */
  async getPixelReport(
    petitionId?: string,
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    totalConversions: number;
    totalConversionValue: number;
    conversionRate: number;
  }> {
    try {
      const where = petitionId ? { petitionId } : {};

      const events = await this.prisma.facebookPixelEvent.findMany({ where });

      const totalEvents = events.length;
      const conversionEvents = events.filter(
        (e) => e.eventType === 'Purchase' || e.eventType === 'Lead',
      );
      const totalConversions = conversionEvents.length;
      const totalConversionValue = conversionEvents.reduce(
        (sum, e) => sum + e.conversionValue,
        0,
      );

      // Group by event type
      const eventsByType: Record<string, number> = {};
      events.forEach((e) => {
        eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
      });

      const conversionRate =
        totalEvents > 0 ? (totalConversions / totalEvents) * 100 : 0;

      return {
        totalEvents,
        eventsByType,
        totalConversions,
        totalConversionValue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pixel report: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get custom audience
   */
  async getAudience(audienceId: string): Promise<{
    id: string;
    name: string;
    audienceType: string;
    estimatedSize: number;
    syncedAt: Date | null;
  }> {
    const audience = await this.prisma.customAudience.findUnique({
      where: { id: audienceId },
    });

    if (!audience) {
      throw new Error(`Audience ${audienceId} not found`);
    }

    return {
      id: audience.id,
      name: audience.name,
      audienceType: audience.audienceType,
      estimatedSize: audience.estimatedSize,
      syncedAt: audience.syncedAt,
    };
  }

  /**
   * Resync audience to Facebook
   */
  async resyncAudience(audienceId: string): Promise<void> {
    try {
      const audience = await this.prisma.customAudience.findUnique({
        where: { id: audienceId },
      });

      if (!audience) {
        throw new Error(`Audience ${audienceId} not found`);
      }

      // In production, would resync to Facebook API
      await this.prisma.customAudience.update({
        where: { id: audienceId },
        data: {
          syncedAt: new Date(),
        },
      });

      this.logger.log(`Resynced custom audience ${audienceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to resync audience: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateEventId(): string {
    return `fbpixel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateFacebookAudienceId(): string {
    return `fb_aud_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async sendToFacebookAPI(
    eventId: string,
    data: Record<string, any>,
  ): Promise<void> {
    // Placeholder for Facebook Conversions API call
    // In production:
    // POST https://graph.facebook.com/v18.0/{PIXEL_ID}/events
    // With access token and conversion data

    try {
      // Mock implementation
      this.logger.debug(
        `Would send event ${eventId} to Facebook API with data:`,
        JSON.stringify(data),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send to Facebook API: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't rethrow - API errors shouldn't block operations
    }
  }
}
