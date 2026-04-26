import { Test, TestingModule } from '@nestjs/testing';
import { ShareDialogService } from './share-dialog.service';
import { FacebookSDKService } from './facebook-sdk.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

/**
 * Share Dialog Service Unit Tests
 * Tests Facebook share dialog integration and share tracking
 */
describe('ShareDialogService', () => {
  let service: ShareDialogService;
  let facebookSdk: jest.Mocked<FacebookSDKService>;
  let prismaService: jest.Mocked<PrismaService>;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    imageUrl: 'https://example.com/image.jpg',
    facebookShareCount: 5,
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    trustScore: 75,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ShareDialogService,
        {
          provide: FacebookSDKService,
          useValue: {
            getAppId: jest.fn().mockReturnValue('test-app-id'),
            getPixelId: jest.fn().mockReturnValue('test-pixel-id'),
            getShareDialogConfig: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            petition: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            shareLink: {
              create: jest.fn(),
            },
            facebookPixelEvent: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: EventBusService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<ShareDialogService>(ShareDialogService);
    facebookSdk = moduleFixture.get(FacebookSDKService) as jest.Mocked<FacebookSDKService>;
    prismaService = moduleFixture.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBusService = moduleFixture.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('Share Dialog Configuration', () => {
    it('should return share dialog config', () => {
      facebookSdk.getShareDialogConfig.mockReturnValue({
        method: 'share',
        href: 'https://example.com/petition/1',
        quote: 'Test Petition',
        hashtag: '#ChangeLiberia',
        picture: 'https://example.com/image.jpg',
        redirect_uri: 'http://localhost:3000/callback',
      });

      const config = service.getShareDialogConfig(
        'petition-1',
        'Test Petition',
        'https://example.com/image.jpg',
      );

      expect(config).toHaveProperty('appId');
      expect(config).toHaveProperty('dialogConfig');
      expect(config).toHaveProperty('pixelId');
      expect(config.appId).toBe('test-app-id');
      expect(config.pixelId).toBe('test-pixel-id');
    });
  });

  describe('Share Button Snippet', () => {
    it('should generate share button snippet', () => {
      const snippet = service.getShareButtonSnippet('petition-1');

      expect(snippet).toContain('fb-share-button');
      expect(snippet).toContain('petition-1');
      expect(snippet).toContain('shareOnFacebook');
    });

    it('should include custom class', () => {
      const snippet = service.getShareButtonSnippet('petition-1', 'custom-btn');

      expect(snippet).toContain('petition-1');
    });
  });

  describe('Record Share Completion', () => {
    it('should record share completion successfully', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
        shortCode: 'abc12345',
      } as any);
      eventBusService.publish.mockReturnValue(undefined);

      const result = await service.recordShareCompletion(
        'user-1',
        'petition-1',
        'dialog',
      );

      expect(result.success).toBe(true);
      expect(result.shareId).toBeDefined();
      expect(prismaService.shareLink.create).toHaveBeenCalled();
      expect(prismaService.petition.update).toHaveBeenCalled();
      expect(eventBusService.publish).toHaveBeenCalled();
    });

    it('should handle missing petition', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      const result = await service.recordShareCompletion(
        'user-1',
        'invalid',
        'dialog',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Petition not found');
    });

    it('should handle missing user', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.recordShareCompletion(
        'invalid',
        'petition-1',
        'dialog',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });

    it('should set shareDialogUsed flag correctly', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
      } as any);

      await service.recordShareCompletion('user-1', 'petition-1', 'dialog');

      expect(prismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shareDialogUsed: true,
        }),
      });
    });

    it('should estimate reach based on trust score', async () => {
      const userWithHighTrust = { ...mockUser, trustScore: 95 };
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.user.findUnique.mockResolvedValue(
        userWithHighTrust as any,
      );
      prismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
      } as any);

      await service.recordShareCompletion('user-1', 'petition-1', 'dialog');

      expect(prismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          networkReachEstimate: expect.any(Number),
        }),
      });
    });
  });

  describe('Share Dialog Scripts', () => {
    it('should return share dialog scripts', () => {
      const scripts = service.getShareDialogScripts();

      expect(scripts).toContain('FB.ui');
      expect(scripts).toContain('shareOnFacebook');
      expect(scripts).toContain('share');
    });

    it('should include conversion tracking', () => {
      const scripts = service.getShareDialogScripts();

      expect(scripts).toContain('gtag');
      expect(scripts).toContain('facebook_share');
    });
  });

  describe('Share Dialog Impressions', () => {
    it('should track share dialog impression', async () => {
      prismaService.facebookPixelEvent.create.mockResolvedValue({} as any);

      await service.trackShareDialogImpression('user-1', 'petition-1');

      expect(prismaService.facebookPixelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          petitionId: 'petition-1',
          eventType: 'ViewContent',
        }),
      });
    });

    it('should handle impression tracking errors gracefully', async () => {
      prismaService.facebookPixelEvent.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.trackShareDialogImpression('user-1', 'petition-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('Validate Share Callback', () => {
    it('should validate recent share callback', () => {
      const now = Date.now();
      const recent = now - 1 * 60 * 1000; // 1 minute ago

      const result = service.validateShareCallback(
        'petition-1',
        'user-1',
        recent,
      );

      expect(result.valid).toBe(true);
    });

    it('should reject expired share callback', () => {
      const now = Date.now();
      const old = now - 10 * 60 * 1000; // 10 minutes ago

      const result = service.validateShareCallback(
        'petition-1',
        'user-1',
        old,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Share Analytics', () => {
    it('should get share analytics', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.shareLink.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          clickCount: 5,
          conversions: 2,
          networkReachEstimate: 100,
        },
        {
          userId: 'user-2',
          clickCount: 3,
          conversions: 1,
          networkReachEstimate: 150,
        },
      ] as any);

      const analytics = await service.getShareAnalytics('petition-1');

      expect(analytics).toHaveProperty('totalShares');
      expect(analytics).toHaveProperty('totalClicks');
      expect(analytics).toHaveProperty('totalConversions');
      expect(analytics).toHaveProperty('topSharers');
      expect(analytics).toHaveProperty('conversionRate');
      expect(analytics).toHaveProperty('averageReach');
      expect(analytics.totalClicks).toBe(8);
      expect(analytics.totalConversions).toBe(3);
    });

    it('should limit top sharers to 10', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );

      const manyShares = Array.from({ length: 20 }, (_, i) => ({
        userId: `user-${i}`,
        clickCount: 1,
        conversions: 0,
        networkReachEstimate: 50 + i * 10,
      }));

      prismaService.shareLink.findMany.mockResolvedValue(manyShares as any);

      const analytics = await service.getShareAnalytics('petition-1');

      expect(analytics.topSharers.length).toBeLessThanOrEqual(10);
    });

    it('should calculate conversion rate correctly', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.shareLink.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          clickCount: 10,
          conversions: 5,
          networkReachEstimate: 100,
        },
      ] as any);

      const analytics = await service.getShareAnalytics('petition-1');

      expect(analytics.conversionRate).toBe(50);
    });
  });
});
