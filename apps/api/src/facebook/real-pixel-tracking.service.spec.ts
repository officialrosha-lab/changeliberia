import { Test, TestingModule } from '@nestjs/testing';
import { RealPixelTrackingService } from './real-pixel-tracking.service';
import { FacebookSDKService } from './facebook-sdk.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Real Pixel Tracking Service Unit Tests
 * Tests Facebook Conversions API integration for server-side pixel tracking
 */
describe('RealPixelTrackingService', () => {
  let service: RealPixelTrackingService;
  let facebookSdk: jest.Mocked<FacebookSDKService>;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
  };

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockPrismaService = {
    petition: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    facebookPixelEvent: {
      create: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customAudience: {
      create: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        RealPixelTrackingService,
        {
          provide: FacebookSDKService,
          useValue: {
            trackConversion: jest.fn(),
            getPixelId: jest.fn().mockReturnValue('test-pixel-id'),
            getAppId: jest.fn().mockReturnValue('test-app-id'),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = moduleFixture.get<RealPixelTrackingService>(
      RealPixelTrackingService,
    );
    facebookSdk = moduleFixture.get(FacebookSDKService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Track View Content', () => {
    it('should track view content event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const result = await service.trackViewContent('petition-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'ViewContent',
        expect.objectContaining({
          contentCategory: 'social_cause',
        }),
        'user-1',
      );
    });

    it('should include user metadata in view content', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackViewContent('petition-1', 'user-1', {
        email: 'test@example.com',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'ViewContent',
        expect.objectContaining({
          email: 'test@example.com',
          phone: '1234567890',
        }),
        'user-1',
      );
    });

    it('should handle missing petition', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      const result = await service.trackViewContent('invalid', 'user-1');

      expect(result.success).toBe(false);
    });
  });

  describe('Track Share', () => {
    it('should track share event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const result = await service.trackShare('petition-1', 'user-1', 'dialog');

      expect(result.success).toBe(true);
      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Share',
        expect.any(Object),
        'user-1',
      );
    });

    it('should track different share methods', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const methods = ['dialog', 'native', 'other'] as const;
      for (const method of methods) {
        await service.trackShare('petition-1', 'user-1', method);
        expect(facebookSdk.trackConversion).toHaveBeenCalled();
      }
    });

    it('should parse user name into first and last name', async () => {
      const userWithFullName = {
        ...mockUser,
        fullName: 'John Michael Doe',
      };
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(userWithFullName);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackShare('petition-1', 'user-1', 'dialog');

      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Share',
        expect.objectContaining({
          firstName: 'John',
        }),
        'user-1',
      );
    });
  });

  describe('Track Lead', () => {
    it('should track lead event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const result = await service.trackLead('petition-1', 'user-1');

      expect(result.success).toBe(true);
      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Lead',
        expect.objectContaining({
          value: 1,
          currency: 'USD',
        }),
        'user-1',
      );
    });

    it('should include metadata in lead event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackLead('petition-1', 'user-1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Lead',
        expect.objectContaining({
          email: 'test@example.com',
        }),
        'user-1',
      );
    });
  });

  describe('Track Purchase', () => {
    it('should track purchase event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const result = await service.trackPurchase(
        'petition-1',
        'user-1',
        25.5,
        'USD',
      );

      expect(result.success).toBe(true);
      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Purchase',
        expect.objectContaining({
          value: 25.5,
          currency: 'USD',
          contentCategory: 'donation',
        }),
        'user-1',
      );
    });

    it('should support different currencies', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackPurchase('petition-1', 'user-1', 100, 'EUR');

      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'Purchase',
        expect.objectContaining({
          currency: 'EUR',
        }),
        'user-1',
      );
    });
  });

  describe('Track Custom Event', () => {
    it('should track custom event', async () => {
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      const result = await service.trackCustomEvent(
        'CustomAction',
        'petition-1',
        'user-1',
        { customField: 'customValue' },
      );

      expect(result.success).toBe(true);
      expect(facebookSdk.trackConversion).toHaveBeenCalledWith(
        'CustomAction',
        expect.objectContaining({
          customField: 'customValue',
        }),
        'user-1',
      );
    });
  });

  describe('Get Pixel Statistics', () => {
    it('should get pixel statistics', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'Lead', createdAt: new Date() },
        { eventType: 'Purchase', createdAt: new Date() },
      ]);

      const stats = await service.getPixelStats('petition-1');

      expect(stats.totalEvents).toBe(4);
      expect(stats.eventsByType['ViewContent']).toBe(2);
      expect(stats.eventsByType['Lead']).toBe(1);
      expect(stats.eventsByType['Purchase']).toBe(1);
    });

    it('should calculate conversion rate', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'ViewContent', createdAt: new Date() },
        { eventType: 'Lead', createdAt: new Date() },
        { eventType: 'Purchase', createdAt: new Date() },
      ]);

      const stats = await service.getPixelStats('petition-1');

      // 2 conversions (Lead + Purchase) / 4 views = 50%
      expect(stats.conversionRate).toBe(50);
    });

    it('should return last event timestamp', async () => {
      const now = new Date();
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([
        { eventType: 'ViewContent', createdAt: now },
      ]);

      const stats = await service.getPixelStats('petition-1');

      expect(stats.lastEventAt).toEqual(now);
    });

    it('should handle no events', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([]);

      const stats = await service.getPixelStats('petition-1');

      expect(stats.totalEvents).toBe(0);
      expect(stats.conversionRate).toBe(0);
      expect(stats.lastEventAt).toBeNull();
    });
  });

  describe('Create Custom Audience', () => {
    it('should create custom audience from pixel events', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      mockPrismaService.customAudience.create.mockResolvedValue({
        id: 'audience-1',
        size: 3,
      });

      const result = await service.createCustomAudience(
        'Viewers',
        'petition-1',
        'ViewContent',
      );

      expect(result.success).toBe(true);
      expect(result.audienceId).toBeDefined();
      expect(mockPrismaService.customAudience.create).toHaveBeenCalledWith({
        data: {
          name: 'Viewers',
          petitionId: 'petition-1',
          audienceType: 'PIXEL_ViewContent',
          userIds: JSON.stringify(['user-1', 'user-2', 'user-3']),
        },
      });
    });

    it('should handle no users for audience', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([]);

      const result = await service.createCustomAudience(
        'Viewers',
        'petition-1',
        'ViewContent',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No users found');
    });

    it('should cap audience size at 10k users', async () => {
      const users = Array.from({ length: 15000 }, (_, i) => ({
        userId: `user-${i}`,
      }));
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue(users);
      mockPrismaService.customAudience.create.mockResolvedValue({
        id: 'audience-1',
      });

      await service.createCustomAudience(
        'Viewers',
        'petition-1',
        'ViewContent',
      );

      const calls = mockPrismaService.customAudience.create.mock
        .calls as unknown[][];
      const callArgs = calls[0][0] as { data: { userIds: string } };
      const userIdsArray: string[] = JSON.parse(
        callArgs.data.userIds,
      ) as string[];
      expect(userIdsArray.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Pixel Configuration', () => {
    it('should return pixel configuration', () => {
      const config = service.getPixelConfig();

      expect(config).toHaveProperty('pixelId');
      expect(config).toHaveProperty('appId');
      expect(config).toHaveProperty('configured');
      expect(config.configured).toBe(true);
    });

    it('should indicate when not configured', () => {
      facebookSdk.getPixelId.mockReturnValue('');
      const newService = new RealPixelTrackingService(
        mockPrismaService as unknown as PrismaService,
        facebookSdk,
      );

      const config = newService.getPixelConfig();

      expect(config.configured).toBe(false);
    });
  });

  describe('Pixel Event Logging', () => {
    it('should log pixel events to database', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
        eventId: 'event-1',
      });
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue({});

      await service.trackViewContent('petition-1', 'user-1');

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petitionId: 'petition-1',
          userId: 'user-1',
          eventType: 'ViewContent',
        }) as Record<string, unknown>,
      });
    });

    it('should handle logging errors gracefully', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      facebookSdk.trackConversion.mockResolvedValue({
        success: true,
      });
      mockPrismaService.facebookPixelEvent.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.trackViewContent('petition-1', 'user-1'),
      ).resolves.toBeDefined();
    });
  });
});
