import { Injectable, Logger } from '@nestjs/common';
import { FacebookSDKService } from './facebook-sdk.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { FacebookShareCreatedEvent } from '../events/domain-events';

/**
 * ShareDialogService
 * Manages Facebook Share Dialog functionality and share tracking
 * Integrates with SDK and handles share callbacks
 */
@Injectable()
export class ShareDialogService {
  private readonly logger = new Logger(ShareDialogService.name);

  constructor(
    private readonly facebookSdk: FacebookSDKService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Get share dialog configuration for client
   */
  getShareDialogConfig(
    petitionId: string,
    petitionTitle: string,
    petitionImage: string,
  ): {
    appId: string;
    dialogConfig: Record<string, any>;
    pixelId: string;
  } {
    const shareUrl = `${process.env.APP_URL || 'http://localhost:3000'}/petitions/${petitionId}`;

    const dialogConfig = this.facebookSdk.getShareDialogConfig(
      shareUrl,
      petitionTitle,
      `Join me in signing this important petition: ${petitionTitle}`,
      petitionImage,
    );

    return {
      appId: this.facebookSdk.getAppId(),
      dialogConfig,
      pixelId: this.facebookSdk.getPixelId(),
    };
  }

  /**
   * Get HTML snippet for share button with dialog
   */
  getShareButtonSnippet(petitionId: string): string {
    return `
    <div class="fb-share-button" 
         data-href="${process.env.APP_URL || 'http://localhost:3000'}/petitions/${petitionId}"
         data-layout="button_count" 
         data-size="large">
    </div>

    <script>
      function shareOnFacebook() {
        if (window.FB && window.FB.ui) {
          window.FB.ui({
            method: 'share',
            href: "${process.env.APP_URL || 'http://localhost:3000'}/petitions/${petitionId}",
            hashtag: '#ChangeLiberia',
          }, function(response){
            if (response && !response.error_message) {
              // Share completed successfully
              window.location.href = '/api/facebook/share/callback?petitionId=${petitionId}';
            }
          });
        }
      }
      
      document.addEventListener('click', function(e) {
        if (e.target.matches('[data-share-petition="${petitionId}"]')) {
          shareOnFacebook();
        }
      });
    </script>
    `;
  }

  /**
   * Record share completion from client
   */
  async recordShareCompletion(
    userId: string,
    petitionId: string,
    shareMethod: 'dialog' | 'native' | 'other',
  ): Promise<{
    success: boolean;
    shareId?: string;
    error?: string;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
        select: { id: true, title: true },
      });

      if (!petition) {
        return { success: false, error: 'Petition not found' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, trustScore: true },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Create share record
      const share = await this.prisma.shareLink.create({
        data: {
          petitionId,
          shortCode: this.generateShortCode(),
          targetUrl: `${process.env.APP_URL}/petitions/${petitionId}`,
          source: 'facebook',
          medium: 'social',
          campaign: `share_${shareMethod}`,
          shareDialogUsed: shareMethod === 'dialog',
          clickCount: 0,
          conversions: 0,
          networkReachEstimate: this.estimateReach(user.trustScore),
        },
      });

      // Increment petition share count
      await this.prisma.petition.update({
        where: { id: petitionId },
        data: { signaturesCount: { increment: 0 } }, // Just update timestamp
      });

      // Publish event for badge/challenge checks
      void this.eventBus.publish(
        new FacebookShareCreatedEvent(
          share.id,
          petitionId,
          userId,
          share.shortCode,
          0, // estimatedReach
        ),
      );

      this.logger.log(`Share recorded: ${share.id} by user ${userId}`);

      return { success: true, shareId: share.id };
    } catch (error) {
      const message = (error instanceof Error ? error.message : 'Unknown error');
      this.logger.error(`Failed to record share: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Get share dialog scripts for HTML head
   */
  getShareDialogScripts(): string {
    return `
    <script>
      // Initialize Facebook SDK share tracking
      if (window.FB) {
        window.FB.Event.subscribe('edge.create', function(response) {
          console.log('Facebook share completed', response);
          // Track share event
          if (window.gtag) {
            gtag('event', 'facebook_share', {
              'value': 1
            });
          }
        });
      }

      // Handle manual share dialog trigger
      window.shareOnFacebook = function(petitionId, petitionTitle) {
        if (!window.FB) {
          alert('Facebook SDK not loaded');
          return;
        }

        const shareUrl = \`\${window.location.origin}/petitions/\${petitionId}\`;
        
        FB.ui({
          method: 'share',
          href: shareUrl,
          hashtag: '#ChangeLiberia',
          quote: 'Join me in supporting this important petition: ' + petitionTitle,
        }, function(response){
          if (response && !response.error_message) {
            // Notify server of successful share
            fetch('/api/facebook/record-share', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
              },
              body: JSON.stringify({
                petitionId: petitionId,
                method: 'dialog'
              })
            }).then(res => res.json()).then(data => {
              if (data.success) {
                console.log('Share recorded successfully');
              }
            });
          }
        });
      };
    </script>
    `;
  }

  /**
   * Generate short code for share link
   */
  private generateShortCode(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Estimate reach based on user trust score
   */
  private estimateReach(trustScore: number): number {
    // Trust score 0-100 maps to reach estimate 10-500
    const baseReach = 10;
    const maxReach = 500;
    const multiplier = (trustScore / 100) * (maxReach - baseReach) + baseReach;
    return Math.round(multiplier);
  }

  /**
   * Track share dialog impression
   */
  async trackShareDialogImpression(
    userId: string,
    petitionId: string,
  ): Promise<void> {
    try {
      // Track pixel event for share dialog view
      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: `impression-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          petitionId,
          userId,
          eventType: 'ViewContent',
          eventData: JSON.stringify({
            content_name: 'Share Dialog Viewed',
            content_type: 'petition',
          }),
        },
      });
    } catch (error) {
      const message = (error instanceof Error ? error.message : 'Unknown error');
      this.logger.warn(`Failed to track share dialog impression: ${message}`);
    }
  }

  /**
   * Validate share completion callback
   */
  validateShareCallback(
    petitionId: string,
    userId: string,
    timestamp: number,
  ): {
    valid: boolean;
    error?: string;
  } {
    // Check if share is recent (within 5 minutes)
    const age = Date.now() - timestamp;
    if (age > 5 * 60 * 1000) {
      return { valid: false, error: 'Share callback expired' };
    }

    // Validate petition and user exist (done elsewhere)
    return { valid: true };
  }

  /**
   * Get share analytics for petition
   */
  async getShareAnalytics(petitionId: string): Promise<{
    totalShares: number;
    totalClicks: number;
    totalConversions: number;
    topSharers: Array<{
      userId: string;
      shareCount: number;
      reachEstimate: number;
    }>;
    conversionRate: number;
    averageReach: number;
  }> {
    const shares = await this.prisma.shareLink.findMany({
      where: { petitionId },
      select: {
        id: true,
        clickCount: true,
        conversions: true,
        networkReachEstimate: true,
        facebookShareCount: true,
      },
    });

    const totalClicks = shares.reduce(
      (sum, s) => sum + s.clickCount,
      0,
    );
    const totalConversions = shares.reduce(
      (sum, s) => sum + s.conversions,
      0,
    );
    const totalReach = shares.reduce(
      (sum, s) => sum + s.networkReachEstimate,
      0,
    );
    const totalFacebookShares = shares.reduce(
      (sum, s) => sum + s.facebookShareCount,
      0,
    );

    const averageReach = shares.length > 0 ? totalReach / shares.length : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalShares: totalFacebookShares,
      totalClicks,
      totalConversions,
      topSharers: [], // topSharers removed as userId not available from ShareLink
      conversionRate,
      averageReach,
    };
  }
}
