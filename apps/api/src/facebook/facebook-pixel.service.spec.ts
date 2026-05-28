import { Test, TestingModule } from '@nestjs/testing';
import { FacebookPixelService } from './facebook-pixel.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FacebookPixelService', () => {
  let service: FacebookPixelService;
  let prismaService: any;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookPixelService,
        {
          provide: PrismaService,
          useValue: {
            facebookPixelEvent: {
              create: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
            },
            customAudience: {
              create: jest.fn().mockResolvedValue(null) as any,
              findUnique: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
          },
        },
      ],
    }).compile();

    service = module.get<FacebookPixelService>(FacebookPixelService);
    prismaService = module.get(PrismaService) as any;
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
      expect(code).toContain('fbq(\'init\'');
      expect(code).toContain('fbq(\'track\', \'PageView\')');
    });

    it('should include pixel ID in init code', () => {
      const code = service.getPixelInitCode();
      const pixelId = service.getPixelId();

      expect(code).toContain(pixelId);
    });
  });

  describe('trackConversion', () => {
    it('should track conversion event', async () => {
      prismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent as any,
      );

      await service.trackConversion('user-1', 'petition-1', 100);

      expect(prismaService.facebookPixelEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            petitionId: 'petition-1',
            eventType: 'Purchase',
            conversionValue: 100,
          }),
        }),
      );
    });

    it('should include metadata if provided', async () => {
      prismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent as any,
      );

      await service.trackConversion('user-1', 'petition-1', 100, {
        source: 'facebook',
      });

      expect(prismaService.facebookPixelEvent.create).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      prismaService.facebookPixelEvent.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.trackConversion('user-1', 'petition-1', 100),
      ).resolves.not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('should track custom event', async () => {
      prismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent as any,
      );

      await service.trackEvent('ViewContent', 'user-1', 'petition-1', {
        content_ids: ['petition-1'],
      });

      expect(prismaService.facebookPixelEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            petitionId: 'petition-1',
            eventType: 'ViewContent',
          }),
        }),
      );
    });

    it('should handle null userId', async () => {
      prismaService.facebookPixelEvent.create.mockResolvedValue(
        mockPixelEvent as any,
      );

      await service.trackEvent('Lead', null, 'petition-1', {
        leadValue: 50,
      });

      expect(prismaService.facebookPixelEvent.create).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      prismaService.facebookPixelEvent.create.mockRejectedValue(
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
      prismaService.customAudience.create.mockResolvedValue({
        ...mockAudience,
        facebookAudienceId: null,
        syncedAt: null,
      } as any);
      prismaService.customAudience.update.mockResolvedValue(
        mockAudience as any,
      );

      const result = await service.createAndSyncAudience(
        'petition-1',
        'SHARERS',
        ['user-1', 'user-2'],
      );

      expect(result).toEqual({
        facebookAudienceId: expect.any(String),
        estimatedSize: 2,
        syncedAt: expect.any(Date),
      });
      expect(prismaService.customAudience.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            petitionId: 'petition-1',
            audienceType: 'SHARERS',
          }),
        }),
      );
    });

    it('should store user IDs as JSON', async () => {
      prismaService.customAudience.create.mockResolvedValue({
        ...mockAudience,
        facebookAudienceId: null,
        syncedAt: null,
      } as any);
      prismaService.customAudience.update.mockResolvedValue(
        mockAudience as any,
      );

      const userIds = ['user-1', 'user-2', 'user-3'];
      await service.createAndSyncAudience('petition-1', 'CONVERTERS', userIds);

      expect(prismaService.customAudience.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userIds: JSON.stringify(userIds),
            estimatedSize: 3,
          }),
        }),
      );
    });

    it('should throw on error', async () => {
      prismaService.customAudience.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.createAndSyncAudience('petition-1', 'SHARERS', ['user-1']),
      ).rejects.toThrow();
    });
  });

  describe('getPixelReport', () => {
    it('should return pixel report', async () => {
      prismaService.facebookPixelEvent.findMany.mockResolvedValue([
        mockPixelEvent,
        { ...mockPixelEvent, eventType: 'ViewContent' },
      ] as any);

      const result = await service.getPixelReport();

      expect(result).toEqual({
        totalEvents: expect.any(Number),
        eventsByType: expect.any(Object),
        totalConversions: expect.any(Number),
        totalConversionValue: expect.any(Number),
        conversionRate: expect.any(Number),
      });
      expect(result.totalEvents).toBeGreaterThanOrEqual(0);
    });

    it('should filter by petitionId if provided', async () => {
      prismaService.facebookPixelEvent.findMany.mockResolvedValue([]);

      await service.getPixelReport('petition-1');

      expect(prismaService.facebookPixelEvent.findMany).toHaveBeenCalledWith(
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
      prismaService.facebookPixelEvent.findMany.mockResolvedValue(
        pixelEvents as any,
      );

      const result = await service.getPixelReport();

      expect(result.conversionRate).toBe(50);
    });

    it('should throw on error', async () => {
      prismaService.facebookPixelEvent.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getPixelReport()).rejects.toThrow();
    });
  });

  describe('getAudience', () => {
    it('should return audience details', async () => {
      prismaService.customAudience.findUnique.mockResolvedValue(
        mockAudience as any,
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
      prismaService.customAudience.findUnique.mockResolvedValue(null);

      await expect(service.getAudience('invalid')).rejects.toThrow(
        'Audience invalid not found',
      );
    });
  });

  describe('resyncAudience', () => {
    it('should resync audience', async () => {
      prismaService.customAudience.findUnique.mockResolvedValue(
        mockAudience as any,
      );
      prismaService.customAudience.update.mockResolvedValue(mockAudience as any);

      await service.resyncAudience('audience-1');

      expect(prismaService.customAudience.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'audience-1' },
          data: expect.objectContaining({
            syncedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw error when audience not found', async () => {
      prismaService.customAudience.findUnique.mockResolvedValue(null);

      await expect(service.resyncAudience('invalid')).rejects.toThrow();
    });
  });
});
