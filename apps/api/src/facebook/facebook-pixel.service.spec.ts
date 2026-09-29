import { Test, TestingModule } from '@nestjs/testing';
import { FacebookPixelService } from './facebook-pixel.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FacebookPixelService', () => {
  let service: FacebookPixelService;

  const mockPixelEvent = {
    id: 'event-1',
    eventId: 'fbpixel_123456_abc123',
    userId: 'user-1',
    petitionId: 'petition-1',
    eventType: 'Purchase',
    eventData: '{"value": 100}',
    conversionValue: 100,
    pixelId: 'placeholder_pixel_id',
    metadata: '{}',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAudience = {
    id: 'audience-1',
    petitionId: 'petition-1',
    name: 'SHARERS - Petition 12345678',
    audienceType: 'SHARERS',
    userIds: '["user-1", "user-2"]',
    estimatedSize: 2,
    facebookAudienceId: 'fb_aud_123456_abc123',
    syncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    facebookPixelEvent: {
      create: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customAudience: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookPixelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FacebookPixelService>(FacebookPixelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPixelId', () => {
    it('should return pixel ID', () => {
      const pixelId = service.getPixelId();

      expect(pixelId).toBeDefined();
      expect(typeof pixelId).toBe('string');
    });
  });

  describe('getPixelInitCode', () => {
    it('should return pixel initialization code', () => {
      const code = service.getPixelInitCode();

      expect(code).toContain('<!-- Facebook Pixel Code -->');
      expect(code).toContain('fbq');
      expect(code).toContain("fbq('init'");
      expect(code).toContain("fbq('track', 'PageView')");
    });

    it('should include pixel ID in init code', () => {
      const code = service.getPixelInitCode();
      const pixelId = service.getPixelId();

      expect(code).toContain(pixelId);
    });
  });

  describe('trackConversion', () => {
    it('should track conversion event', async () => {
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent,
      );

      await service.trackConversion('user-1', 'petition-1', 100);

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            petitionId: 'petition-1',
            eventType: 'Purchase',
            conversionValue: 100,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should include metadata if provided', async () => {
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent,
      );

      await service.trackConversion('user-1', 'petition-1', 100, {
        source: 'facebook',
      });

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockPrismaService.facebookPixelEvent.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.trackConversion('user-1', 'petition-1', 100),
      ).resolves.not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('should track custom event', async () => {
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent,
      );

      await service.trackEvent('ViewContent', 'user-1', 'petition-1', {
        content_ids: ['petition-1'],
      });

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            petitionId: 'petition-1',
            eventType: 'ViewContent',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should handle null userId', async () => {
      mockPrismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent,
      );

      await service.trackEvent('Lead', null, 'petition-1', {
        leadValue: 50,
      });

      expect(mockPrismaService.facebookPixelEvent.create).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockPrismaService.facebookPixelEvent.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.trackEvent('Purchase', 'user-1', 'petition-1', {
          value: 100,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('createAndSyncAudience', () => {
    it('should create and sync custom audience', async () => {
      mockPrismaService.customAudience.create.mockResolvedValue({
        ...mockAudience,
        facebookAudienceId: null,
        syncedAt: null,
      });
      mockPrismaService.customAudience.update.mockResolvedValue(mockAudience);

      const result = await service.createAndSyncAudience(
        'petition-1',
        'SHARERS',
        ['user-1', 'user-2'],
      );

      expect(result).toEqual({
        facebookAudienceId: expect.any(String) as string,
        estimatedSize: 2,
        syncedAt: expect.any(Date) as Date,
      });
      expect(mockPrismaService.customAudience.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            petitionId: 'petition-1',
            audienceType: 'SHARERS',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should store user IDs as JSON', async () => {
      mockPrismaService.customAudience.create.mockResolvedValue({
        ...mockAudience,
        facebookAudienceId: null,
        syncedAt: null,
      });
      mockPrismaService.customAudience.update.mockResolvedValue(mockAudience);

      const userIds = ['user-1', 'user-2', 'user-3'];
      await service.createAndSyncAudience('petition-1', 'CONVERTERS', userIds);

      expect(mockPrismaService.customAudience.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userIds: JSON.stringify(userIds),
            estimatedSize: 3,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should throw on error', async () => {
      mockPrismaService.customAudience.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.createAndSyncAudience('petition-1', 'SHARERS', ['user-1']),
      ).rejects.toThrow();
    });
  });

  describe('getPixelReport', () => {
    it('should return pixel report', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([
        mockPixelEvent,
        { ...mockPixelEvent, eventType: 'ViewContent' },
      ]);

      const result = await service.getPixelReport();

      expect(result).toEqual({
        totalEvents: expect.any(Number) as number,
        eventsByType: expect.any(Object) as Record<string, number>,
        totalConversions: expect.any(Number) as number,
        totalConversionValue: expect.any(Number) as number,
        conversionRate: expect.any(Number) as number,
      });
      expect(result.totalEvents).toBeGreaterThanOrEqual(0);
    });

    it('should filter by petitionId if provided', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue([]);

      await service.getPixelReport('petition-1');

      expect(
        mockPrismaService.facebookPixelEvent.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { petitionId: 'petition-1' },
        }),
      );
    });

    it('should calculate conversion rate correctly', async () => {
      const pixelEvents = [
        { ...mockPixelEvent, eventType: 'Purchase', conversionValue: 100 },
        { ...mockPixelEvent, eventType: 'ViewContent', conversionValue: 0 },
      ];
      mockPrismaService.facebookPixelEvent.findMany.mockResolvedValue(
        pixelEvents,
      );

      const result = await service.getPixelReport();

      expect(result.conversionRate).toBe(50);
    });

    it('should throw on error', async () => {
      mockPrismaService.facebookPixelEvent.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getPixelReport()).rejects.toThrow();
    });
  });

  describe('getAudience', () => {
    it('should return audience details', async () => {
      mockPrismaService.customAudience.findUnique.mockResolvedValue(
        mockAudience,
      );

      const result = await service.getAudience('audience-1');

      expect(result).toEqual({
        id: mockAudience.id,
        name: mockAudience.name,
        audienceType: mockAudience.audienceType,
        estimatedSize: mockAudience.estimatedSize,
        syncedAt: mockAudience.syncedAt,
      });
    });

    it('should throw error when audience not found', async () => {
      mockPrismaService.customAudience.findUnique.mockResolvedValue(null);

      await expect(service.getAudience('invalid')).rejects.toThrow(
        'Audience invalid not found',
      );
    });
  });

  describe('resyncAudience', () => {
    it('should resync audience', async () => {
      mockPrismaService.customAudience.findUnique.mockResolvedValue(
        mockAudience,
      );
      mockPrismaService.customAudience.update.mockResolvedValue(mockAudience);

      await service.resyncAudience('audience-1');

      expect(mockPrismaService.customAudience.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'audience-1' },
          data: expect.objectContaining({
            syncedAt: expect.any(Date) as Date,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should throw error when audience not found', async () => {
      mockPrismaService.customAudience.findUnique.mockResolvedValue(null);

      await expect(service.resyncAudience('invalid')).rejects.toThrow();
    });
  });
});
