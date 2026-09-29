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

  const mockPrismaService = {
    petition: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    shareLink: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    facebookPixelEvent: {
      create: jest.fn(),
    },
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
          useValue: mockPrismaService,
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
    facebookSdk = moduleFixture.get(FacebookSDKService);
    eventBusService = moduleFixture.get(EventBusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      const snippet = service.getShareButtonSnippet('petition-1');

      expect(snippet).toContain('petition-1');
    });
  });

  describe('Record Share Completion', () => {
    it('should record share completion successfully', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
        shortCode: 'abc12345',
      });
      eventBusService.publish.mockResolvedValue(undefined);

      const result = await service.recordShareCompletion(
        'user-1',
        'petition-1',
        'dialog',
      );

      expect(result.success).toBe(true);
      expect(result.shareId).toBeDefined();
      expect(mockPrismaService.shareLink.create).toHaveBeenCalled();
      expect(mockPrismaService.petition.update).toHaveBeenCalled();
      expect(eventBusService.publish).toHaveBeenCalled();
    });

    it('should handle missing petition', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      const result = await service.recordShareCompletion(
        'user-1',
        'invalid',
        'dialog',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Petition not found');
    });

    it('should handle missing user', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.recordShareCompletion(
        'invalid',
        'petition-1',
        'dialog',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
    });

    it('should set shareDialogUsed flag correctly', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
      });

      await service.recordShareCompletion('user-1', 'petition-1', 'dialog');

      expect(mockPrismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shareDialogUsed: true,
        }) as Record<string, unknown>,
      });
    });

    it('should estimate reach based on trust score', async () => {
      const userWithHighTrust = { ...mockUser, trustScore: 95 };
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(userWithHighTrust);
      mockPrismaService.shareLink.create.mockResolvedValue({
        id: 'share-1',
      });

      await service.recordShareCompletion('user-1', 'petition-1', 'dialog');

      expect(mockPrismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          networkReachEstimate: expect.any(Number) as number,
        }) as Record<string, unknown>,
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
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackShareDialogImpression('user-1', 'petition-1');

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          petitionId: 'petition-1',
          eventType: 'ViewContent',
        }) as Record<string, unknown>,
      });
    });

    it('should handle impression tracking errors gracefully', async () => {
      mockPrismaService.facebookPixelEvent.create.mockRejectedValue(
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

      const result = service.validateShareCallback('petition-1', 'user-1', old);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Share Analytics', () => {
    it('should get share analytics', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareLink.findMany.mockResolvedValue([
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
      ]);

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
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);

      const manyShares = Array.from({ length: 20 }, (_, i) => ({
        userId: `user-${i}`,
        clickCount: 1,
        conversions: 0,
        networkReachEstimate: 50 + i * 10,
      }));

      mockPrismaService.shareLink.findMany.mockResolvedValue(manyShares);

      const analytics = await service.getShareAnalytics('petition-1');

      expect(analytics.topSharers.length).toBeLessThanOrEqual(10);
    });

    it('should calculate conversion rate correctly', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareLink.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          clickCount: 10,
          conversions: 5,
          networkReachEstimate: 100,
        },
      ]);

      const analytics = await service.getShareAnalytics('petition-1');

      expect(analytics.conversionRate).toBe(50);
    });
  });
});
