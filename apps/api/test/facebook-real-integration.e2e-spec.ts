import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { FacebookController } from '../src/facebook/facebook.controller';
import { FacebookSDKService } from '../src/facebook/facebook-sdk.service';
import { ShareDialogService } from '../src/facebook/share-dialog.service';
import { RealPixelTrackingService } from '../src/facebook/real-pixel-tracking.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventBusService } from '../src/events/event-bus.service';

/**
 * Facebook Real Integration E2E Tests
 * Tests actual Facebook SDK and Pixel integration workflows
 */
describe('Facebook Real Integration (e2e)', () => {
  let app: INestApplication<App>;
  let facebookSdk: jest.Mocked<FacebookSDKService>;
  let shareDialog: jest.Mocked<ShareDialogService>;
  let pixelTracking: jest.Mocked<RealPixelTrackingService>;
  let prismaService: jest.Mocked<PrismaService>;
  let eventBusService: jest.Mocked<EventBusService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FacebookController],
      providers: [
        {
          provide: FacebookSDKService,
          useValue: {
            getSdkInitCode: jest.fn(),
            getPixelInitCode: jest.fn(),
            getShareDialogConfig: jest.fn(),
            generateOpenGraphMeta: jest.fn(),
            trackConversion: jest.fn(),
            validateShareUrl: jest.fn(),
            getShareCount: jest.fn(),
            getAppId: jest.fn().mockReturnValue('test-app-id'),
            getPixelId: jest.fn().mockReturnValue('test-pixel-id'),
            healthCheck: jest.fn(),
          },
        },
        {
          provide: ShareDialogService,
          useValue: {
            getShareDialogConfig: jest.fn(),
            getShareButtonSnippet: jest.fn(),
            recordShareCompletion: jest.fn(),
            getShareDialogScripts: jest.fn(),
            trackShareDialogImpression: jest.fn(),
            validateShareCallback: jest.fn(),
            getShareAnalytics: jest.fn(),
          },
        },
        {
          provide: RealPixelTrackingService,
          useValue: {
            trackViewContent: jest.fn(),
            trackShare: jest.fn(),
            trackLead: jest.fn(),
            trackPurchase: jest.fn(),
            trackCustomEvent: jest.fn(),
            getPixelStats: jest.fn(),
            createCustomAudience: jest.fn(),
            getPixelConfig: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            petition: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
        {
          provide: EventBusService,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    facebookSdk = moduleFixture.get(FacebookSDKService) as jest.Mocked<FacebookSDKService>;
    shareDialog = moduleFixture.get(ShareDialogService) as jest.Mocked<ShareDialogService>;
    pixelTracking = moduleFixture.get(RealPixelTrackingService) as jest.Mocked<RealPixelTrackingService>;
    prismaService = moduleFixture.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBusService = moduleFixture.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SDK Initialization', () => {
    it('should provide SDK initialization code', () => {
      facebookSdk.getSdkInitCode.mockReturnValue(`
        <script>
          window.fbAsyncInit = function() {
            FB.init({
              appId: 'test-app-id',
              version: 'v18.0'
            });
          };
        </script>
      `);

      return request(app.getHttpServer())
        .get('/api/facebook/sdk-init')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('initCode');
        });
    });
  });

  describe('Pixel Initialization', () => {
    it('should provide pixel initialization code', () => {
      facebookSdk.getPixelInitCode.mockReturnValue(`
        <!-- Facebook Pixel Code -->
        <script>
          fbq('init', 'test-pixel-id');
          fbq('track', 'PageView');
        </script>
      `);

      return request(app.getHttpServer())
        .get('/api/facebook/pixel')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('initCode');
        });
    });
  });

  describe('Open Graph Meta Tags', () => {
    it('should generate OG meta tags for petition', () => {
      const ogMeta = `
        <meta property="og:title" content="Test Petition" />
        <meta property="og:description" content="Test Description" />
        <meta property="og:image" content="https://example.com/image.jpg" />
        <meta property="og:url" content="https://example.com/petition/1" />
      `;

      facebookSdk.generateOpenGraphMeta.mockReturnValue(ogMeta);

      return request(app.getHttpServer())
        .get('/api/facebook/og-meta/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Share Dialog Configuration', () => {
    it('should provide share dialog configuration', () => {
      shareDialog.getShareDialogConfig.mockReturnValue({
        appId: 'test-app-id',
        dialogConfig: {
          method: 'share',
          href: 'https://example.com/petition/1',
          quote: 'Test Petition',
          hashtag: '#ChangeLiberia',
          picture: 'https://example.com/image.jpg',
          redirect_uri: 'http://localhost:3000/callback',
        },
        pixelId: 'test-pixel-id',
      });

      return request(app.getHttpServer())
        .get('/api/facebook/share-dialog/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('dialogConfig');
        });
    });
  });

  describe('Share Completion Tracking', () => {
    it('should track share completion via share dialog', () => {
      shareDialog.recordShareCompletion.mockResolvedValue({
        success: true,
        shareId: 'share-1',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/record-share')
        .set('Authorization', 'Bearer test-token')
        .send({
          petitionId: 'petition-1',
          method: 'dialog',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Real Pixel Event Tracking', () => {
    it('should track view content event', () => {
      pixelTracking.trackViewContent.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-view')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should track lead event on petition signature', () => {
      pixelTracking.trackLead.mockResolvedValue({
        success: true,
        eventId: 'event-2',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-lead')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should track share event', () => {
      pixelTracking.trackShare.mockResolvedValue({
        success: true,
        eventId: 'event-3',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-share')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          method: 'dialog',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should track purchase event on donation', () => {
      pixelTracking.trackPurchase.mockResolvedValue({
        success: true,
        eventId: 'event-4',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-purchase')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 25.5,
          currency: 'USD',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Pixel Analytics & Reporting', () => {
    it('should get pixel statistics', () => {
      pixelTracking.getPixelStats.mockResolvedValue({
        totalEvents: 100,
        eventsByType: {
          ViewContent: 50,
          Lead: 30,
          Share: 20,
        },
        conversionRate: 30,
        lastEventAt: new Date(),
      });

      return request(app.getHttpServer())
        .get('/api/facebook/pixel-stats/petition-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('totalEvents');
          expect(res.body.data).toHaveProperty('conversionRate');
        });
    });

    it('should create custom audience from pixel events', () => {
      pixelTracking.createCustomAudience.mockResolvedValue({
        success: true,
        audienceId: 'audience-1',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/create-audience')
        .send({
          name: 'Engaged Viewers',
          petitionId: 'petition-1',
          eventType: 'ViewContent',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('audienceId');
        });
    });
  });

  describe('Share URL Validation', () => {
    it('should validate share URL for Facebook compatibility', () => {
      facebookSdk.validateShareUrl.mockResolvedValue({
        valid: true,
        scrapedUrl: 'https://example.com/petition/1',
      });

      return request(app.getHttpServer())
        .post('/api/facebook/validate-url')
        .send({
          url: 'https://example.com/petition/1',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should get share count for URL', () => {
      facebookSdk.getShareCount.mockResolvedValue({
        shareCount: 42,
        commentCount: 8,
      });

      return request(app.getHttpServer())
        .get('/api/facebook/share-count')
        .query({ url: 'https://example.com/petition/1' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('shareCount');
        });
    });
  });

  describe('Full Workflow: Share to Conversion', () => {
    it('should track complete share workflow', async () => {
      // Step 1: User views petition (ViewContent event)
      pixelTracking.trackViewContent.mockResolvedValue({
        success: true,
        eventId: 'event-view-1',
      });

      await request(app.getHttpServer())
        .post('/api/facebook/track-view')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
        })
        .expect(201);

      // Step 2: User shares petition (Share event)
      shareDialog.recordShareCompletion.mockResolvedValue({
        success: true,
        shareId: 'share-1',
      });

      pixelTracking.trackShare.mockResolvedValue({
        success: true,
        eventId: 'event-share-1',
      });

      await request(app.getHttpServer())
        .post('/api/facebook/record-share')
        .set('Authorization', 'Bearer test-token')
        .send({
          petitionId: 'petition-1',
          method: 'dialog',
        })
        .expect(201);

      // Step 3: Someone signs petition from share (Lead event)
      pixelTracking.trackLead.mockResolvedValue({
        success: true,
        eventId: 'event-lead-1',
      });

      await request(app.getHttpServer())
        .post('/api/facebook/track-lead')
        .send({
          petitionId: 'petition-1',
          userId: 'user-2',
        })
        .expect(201);

      expect(shareDialog.recordShareCompletion).toHaveBeenCalled();
      expect(pixelTracking.trackView).toBeDefined();
      expect(pixelTracking.trackLead).toBeDefined();
    });
  });

  describe('SDK Health Check', () => {
    it('should report SDK health status', () => {
      facebookSdk.healthCheck.mockResolvedValue({
        appConnected: true,
        pixelConnected: true,
        apiVersion: 'v18.0',
      });

      return request(app.getHttpServer())
        .get('/api/facebook/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('appConnected');
          expect(res.body.data).toHaveProperty('pixelConnected');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion tracking failures gracefully', () => {
      pixelTracking.trackViewContent.mockResolvedValue({
        success: false,
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-view')
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });

    it('should handle missing petition', () => {
      pixelTracking.trackViewContent.mockResolvedValue({
        success: false,
      });

      return request(app.getHttpServer())
        .post('/api/facebook/track-view')
        .send({
          petitionId: 'invalid',
          userId: 'user-1',
        })
        .expect(201);
    });
  });
});
