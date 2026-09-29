import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

describe('FacebookService', () => {
  let service: FacebookService;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    description: 'Test Description',
    summary: 'Test Summary',
    signaturesCount: 100,
    goal: 500,
    imageUrl: 'https://example.com/image.jpg',
    facebookShareCount: 0,
    creator: {
      id: 'user-1',
      name: 'Test Creator',
    },
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    trustScore: 75,
  };

  const mockShareLink = {
    id: 'share-1',
    shortCode: 'abc12345',
    targetUrl: 'https://example.com/petitions/petition-1',
    petitionId: 'petition-1',
    source: 'facebook',
    medium: 'social',
    campaign: 'user_share',
    shareDialogUsed: true,
    clickCount: 5,
    conversions: 2,
    networkReachEstimate: 250,
    lastClickedAt: new Date(),
  };

  const mockPrismaService = {
    petition: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    shareLink: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
    },
    facebookPixelEvent: {
      create: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookService,
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

    service = module.get<FacebookService>(FacebookService);
    eventBusService = module.get(EventBusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOpenGraphMeta', () => {
    it('should generate OG metadata for a petition', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);

      const result = await service.generateOpenGraphMeta('petition-1');

      expect(result).toEqual({
        title: expect.stringContaining('Test Petition') as string,
        description: expect.stringContaining('Test Summary') as string,
        image: 'https://example.com/image.jpg',
        url: 'https://changeliberia.org/petitions/petition-1',
        type: 'website',
      });
      expect(result.title).toContain('20%');
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(service.generateOpenGraphMeta('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default OG image when petition has no image', async () => {
      const petitionWithoutImage = { ...mockPetition, imageUrl: null };
      mockPrismaService.petition.findUnique.mockResolvedValue(
        petitionWithoutImage,
      );

      const result = await service.generateOpenGraphMeta('petition-1');

      expect(result.image).toBe('https://changeliberia.org/og-default.png');
    });
  });

  describe('createFacebookShareLink', () => {
    it('should create a Facebook share link and publish event', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.shareLink.create.mockResolvedValue(mockShareLink);

      const result = await service.createFacebookShareLink(
        'petition-1',
        'user-1',
      );

      expect(result).toEqual({
        shareUrl: expect.stringContaining('/r/') as string,
        shortCode: expect.any(String) as string,
        reachEstimate: expect.any(Number) as number,
        prefilledMessage: expect.any(String) as string,
      });
      expect(result.shareUrl).toContain(result.shortCode);
      expect(eventBusService.publish).toHaveBeenCalled();
      expect(mockPrismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUrl: 'https://changeliberia.org/petitions/petition-1',
          petitionId: 'petition-1',
          source: 'facebook',
        }) as Record<string, unknown>,
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.createFacebookShareLink('invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createFacebookShareLink('petition-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate reach estimate based on trust score', async () => {
      const highTrustUser = { ...mockUser, trustScore: 150 };
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.user.findUnique.mockResolvedValue(highTrustUser);
      mockPrismaService.shareLink.create.mockResolvedValue(mockShareLink);

      const result = await service.createFacebookShareLink(
        'petition-1',
        'user-1',
      );

      expect(result.reachEstimate).toBeGreaterThan(250);
    });
  });

  describe('buildFacebookShareDialog', () => {
    it('should build share dialog config', () => {
      const result = service.buildFacebookShareDialog('petition-1');

      expect(result).toEqual({
        quote: expect.stringContaining('petition') as string,
        hashtag: expect.stringContaining('#ChangeLiberia') as string,
        link: 'https://changeliberia.org/petitions/petition-1',
        dialogTitle: 'Share This Petition',
      });
      expect(result.hashtag).toContain('#CommunityVoice');
    });

    it('should include network size estimate in quote', () => {
      const result = service.buildFacebookShareDialog('petition-1', 500);

      expect(result.quote).toContain('~');
      expect(result.quote).toContain('voices');
    });
  });

  describe('trackFacebookClick', () => {
    it('should track a Facebook click and return target URL', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue(mockShareLink);
      mockPrismaService.shareLink.update.mockResolvedValue(mockShareLink);

      const result = await service.trackFacebookClick('abc12345');

      expect(result).toBe(mockShareLink.targetUrl);
      expect(mockPrismaService.shareLink.update).toHaveBeenCalledWith({
        where: { shortCode: 'abc12345' },
        data: expect.objectContaining({
          clickCount: { increment: 1 },
        }) as Record<string, unknown>,
      });
    });

    it('should throw NotFoundException when share link does not exist', async () => {
      mockPrismaService.shareLink.findUnique.mockResolvedValue(null);

      await expect(service.trackFacebookClick('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordFacebookShare', () => {
    it('should record a Facebook share', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);

      await service.recordFacebookShare('petition-1', 'user-1');

      expect(mockPrismaService.petition.findUnique).toHaveBeenCalledWith({
        where: { id: 'petition-1' },
      });
    });

    it('should update share count when shortCode is provided', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareLink.findUnique.mockResolvedValue(mockShareLink);

      await service.recordFacebookShare('petition-1', 'user-1', 'abc12345');

      expect(mockPrismaService.shareLink.update).toHaveBeenCalledWith({
        where: { shortCode: 'abc12345' },
        data: expect.objectContaining({
          facebookShareCount: { increment: 1 },
        }) as Record<string, unknown>,
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.recordFacebookShare('invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateNetworkReach', () => {
    it('should calculate network reach based on trust score', () => {
      const result = service.calculateNetworkReach(mockUser);

      expect(result.estimatedReach).toBeGreaterThan(0);
      expect(result.multiplier).toBeGreaterThan(0);
      expect(typeof result.influencer).toBe('boolean');
    });

    it('should mark high trust users as influencers', () => {
      const highTrustUser = { ...mockUser, trustScore: 75 };
      const result = service.calculateNetworkReach(highTrustUser);

      expect(result.influencer).toBe(true);
      expect(result.multiplier).toBeGreaterThan(1);
    });

    it('should give lower multiplier to non-influencers', () => {
      const lowTrustUser = { ...mockUser, trustScore: 20 };
      const result = service.calculateNetworkReach(lowTrustUser);

      expect(result.influencer).toBe(false);
      expect(result.multiplier).toBe(1.5);
    });
  });

  describe('estimateViralMultiplier', () => {
    it('should estimate viral multiplier based on trust score', () => {
      const multiplier = service.estimateViralMultiplier(50, 250);

      expect(multiplier).toBeGreaterThan(1);
      expect(multiplier).toBeLessThanOrEqual(5);
    });

    it('should cap multiplier at 5x', () => {
      const multiplier = service.estimateViralMultiplier(1000, 1000);

      expect(multiplier).toBeLessThanOrEqual(5);
    });

    it('should increase with higher trust score', () => {
      const lowMultiplier = service.estimateViralMultiplier(10, 250);
      const highMultiplier = service.estimateViralMultiplier(100, 250);

      expect(highMultiplier).toBeGreaterThan(lowMultiplier);
    });
  });

  describe('getFacebookAnalytics', () => {
    it('should return Facebook analytics for a petition', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareLink.findMany.mockResolvedValue([
        mockShareLink,
        { ...mockShareLink, clickCount: 10, conversions: 3 },
      ]);

      const result = await service.getFacebookAnalytics('petition-1');

      expect(result).toEqual({
        totalShares: expect.any(Number) as number,
        totalClicks: expect.any(Number) as number,
        conversions: expect.any(Number) as number,
        conversionRate: expect.any(Number) as number,
        reachEstimate: expect.any(Number) as number,
        topSharers: expect.any(Array) as unknown[],
      });
      expect(result.totalShares).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(service.getFacebookAnalytics('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCustomAudience', () => {
    it('should get custom audience for sharers', async () => {
      mockPrismaService.shareLink.findMany.mockResolvedValue([
        { ...mockShareLink, referral: { referrerId: 'user-1' } },
      ]);

      const result = await service.getCustomAudience('petition-1', 'SHARERS');

      expect(result).toEqual({
        userIds: expect.any(Array) as unknown[],
        estimatedSize: expect.any(Number) as number,
        description: expect.stringContaining('shared') as string,
      });
    });

    it('should get custom audience for converters', async () => {
      mockPrismaService.shareLink.findMany.mockResolvedValue([]);

      const result = await service.getCustomAudience(
        'petition-1',
        'CONVERTERS',
      );

      expect(result.description).toContain('shares resulted in');
    });

    it('should get custom audience for influencers', async () => {
      mockPrismaService.shareLink.findMany.mockResolvedValue([]);

      const result = await service.getCustomAudience(
        'petition-1',
        'INFLUENCERS',
      );

      expect(result.description).toContain('Influencers');
    });
  });
});
