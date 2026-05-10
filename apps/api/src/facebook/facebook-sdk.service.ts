import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * FacebookSDKService
 * Handles all interactions with Facebook Graph API and SDK initialization
 * Manages API version, access tokens, and request validation
 */
@Injectable()
export class FacebookSDKService {
  private readonly logger = new Logger(FacebookSDKService.name);
  private graphApi: AxiosInstance;
  private appId: string;
  private appSecret: string;
  private pixelId: string;
  private accessToken: string;
  private apiVersion = 'v18.0';

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.pixelId = process.env.FACEBOOK_PIXEL_ID || '';
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';

    this.graphApi = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 10000,
    });

    this.validateConfiguration();
  }

  /**
   * Validate that all required Facebook credentials are configured
   */
  private validateConfiguration(): void {
    const missing: string[] = [];

    if (!this.appId) missing.push('FACEBOOK_APP_ID');
    if (!this.appSecret) missing.push('FACEBOOK_APP_SECRET');
    if (!this.pixelId) missing.push('FACEBOOK_PIXEL_ID');
    if (!this.accessToken) missing.push('FACEBOOK_ACCESS_TOKEN');

    if (missing.length > 0) {
      this.logger.warn(
        `Missing Facebook configuration: ${missing.join(', ')}. Some features will be limited.`,
      );
    }
  }

  /**
   * Get SDK initialization code for client-side
   */
  getSdkInitCode(): string {
    if (!this.appId) {
      return '<!-- Facebook SDK not configured -->';
    }

    return `
    <script>
      window.fbAsyncInit = function() {
        FB.init({
          appId      : '${this.appId}',
          xfbml      : true,
          version    : '${this.apiVersion}'
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    </script>
    `;
  }

  /**
   * Get pixel initialization code for tracking
   */
  getPixelInitCode(): string {
    if (!this.pixelId) {
      return '<!-- Facebook Pixel not configured -->';
    }

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
      fbq('init', '${this.pixelId}');
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Facebook Pixel Code -->
    `;
  }

  /**
   * Track conversion event via Graph API (server-side)
   */
  async trackConversion(
    eventName: string,
    eventData: Record<string, any>,
    userId?: string,
  ): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    if (!this.pixelId || !this.accessToken) {
      this.logger.warn('Cannot track conversion: Pixel ID or access token missing');
      return { success: false, error: 'Pixel not configured' };
    }

    try {
      const payload = {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              em: eventData.email ? this.hashEmail(eventData.email) : undefined,
              ph: eventData.phone ? this.hashPhone(eventData.phone) : undefined,
              fn: eventData.firstName
                ? this.hashValue(eventData.firstName)
                : undefined,
              ln: eventData.lastName
                ? this.hashValue(eventData.lastName)
                : undefined,
              uid: userId || eventData.userId,
            },
            event_id: eventData.eventId || this.generateEventId(),
            event_source_url: eventData.sourceUrl,
            custom_data: {
              value: eventData.value || 0,
              currency: eventData.currency || 'USD',
              content_name: eventData.contentName || 'Petition Share',
              content_type: 'petition',
              content_category: eventData.contentCategory || 'social_share',
            },
          },
        ],
      };

      const response = await this.graphApi.post(
        `/${this.pixelId}/events`,
        payload,
        {
          params: { access_token: this.accessToken },
        },
      );

      this.logger.log(
        `Conversion tracked: ${eventName} (Event ID: ${payload.data[0].event_id})`,
      );

      return {
        success: true,
        eventId: payload.data[0].event_id,
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(
        `Failed to track conversion: ${err?.message || 'Unknown error'}`,
      );
      return {
        success: false,
        error: err?.message || 'Failed to track conversion',
      };
    }
  }

  /**
   * Get share dialog parameters for client-side SDK
   */
  getShareDialogConfig(
    url: string,
    title: string,
    description: string,
    imageUrl: string,
  ): {
    method: string;
    href: string;
    quote: string;
    hashtag: string;
    picture: string;
    redirect_uri: string;
  } {
    return {
      method: 'share',
      href: url,
      quote: title,
      hashtag: '#ChangeLiberia',
      picture: imageUrl,
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/auth/facebook/callback`,
    };
  }

  /**
   * Validate share URL for Facebook compatibility
   */
  async validateShareUrl(url: string): Promise<{
    valid: boolean;
    scrapedUrl?: string;
    error?: string;
  }> {
    if (!this.accessToken) {
      return { valid: false, error: 'Access token not configured' };
    }

    try {
      const response = await this.graphApi.get('/', {
        params: {
          id: url,
          fields: 'og_object',
          access_token: this.accessToken,
        },
      });

      return {
        valid: !!response.data,
        scrapedUrl: response.data?.og_object?.url || url,
      };
    } catch (error) {
      const err = error as any;
      this.logger.warn(`Share URL validation failed: ${err?.message}`);
      return {
        valid: false,
        error: err?.message || 'Validation failed',
      };
    }
  }

  /**
   * Get share count for a URL
   */
  async getShareCount(url: string): Promise<{
    shareCount: number;
    commentCount: number;
    error?: string;
  }> {
    if (!this.accessToken) {
      return {
        shareCount: 0,
        commentCount: 0,
        error: 'Access token not configured',
      };
    }

    try {
      const response = await this.graphApi.get('/', {
        params: {
          id: url,
          fields: 'engagement',
          access_token: this.accessToken,
        },
      });

      const engagement = response.data?.engagement || {};
      return {
        shareCount: engagement.share_count || 0,
        commentCount: engagement.comment_count || 0,
      };
    } catch (error) {
      const err = error as any;
      this.logger.warn(`Failed to get share count: ${err?.message}`);
      return {
        shareCount: 0,
        commentCount: 0,
        error: err?.message,
      };
    }
  }

  /**
   * Generate OpenGraph metadata for sharing
   */
  generateOpenGraphMeta(data: {
    title: string;
    description: string;
    image: string;
    url: string;
    type?: string;
    locale?: string;
  }): string {
    return `
    <meta property="og:type" content="${data.type || 'website'}" />
    <meta property="og:title" content="${this.escapeHtml(data.title)}" />
    <meta property="og:description" content="${this.escapeHtml(data.description)}" />
    <meta property="og:image" content="${data.image}" />
    <meta property="og:url" content="${data.url}" />
    <meta property="og:locale" content="${data.locale || 'en_US'}" />
    <meta property="fb:app_id" content="${this.appId}" />
    `;
  }

  /**
   * Hash email for Conversions API (SHA256)
   */
  private hashEmail(email: string): string {
    return this.hashValue(email.toLowerCase().trim());
  }

  /**
   * Hash phone for Conversions API
   */
  private hashPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return this.hashValue(cleaned);
  }

  /**
   * Hash value using SHA256
   */
  private hashValue(value: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get App ID for client-side SDK
   */
  getAppId(): string {
    return this.appId;
  }

  /**
   * Get Pixel ID for client-side tracking
   */
  getPixelId(): string {
    return this.pixelId;
  }

  /**
   * Get API version
   */
  getApiVersion(): string {
    return this.apiVersion;
  }

  /**
   * Health check for Facebook API connectivity
   */
  async healthCheck(): Promise<{
    appConnected: boolean;
    pixelConnected: boolean;
    apiVersion: string;
  }> {
    try {
      if (this.accessToken) {
        await this.graphApi.get('/me', {
          params: { access_token: this.accessToken },
        });
      }

      return {
        appConnected: !!this.appId,
        pixelConnected: !!this.pixelId,
        apiVersion: this.apiVersion,
      };
    } catch (error) {
      this.logger.error('Facebook API health check failed');
      return {
        appConnected: false,
        pixelConnected: false,
        apiVersion: this.apiVersion,
      };
    }
  }
}
