import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

describe('FacebookService', () => {
  let service: FacebookService;
  let prismaService: any;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookService,
        {
          provide: PrismaService,
          useValue: {
            petition: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
            shareLink: {
              create: jest.fn().mockResolvedValue(null) as any,
              findUnique: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
            facebookPixelEvent: {
              create: jest.fn().mockResolvedValue(null) as any,
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

    service = module.get<FacebookService>(FacebookService);
    prismaService = module.get(PrismaService) as any;
    eventBusService = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  describe('generateOpenGraphMeta', () => {
    it('should generate OG metadata for a petition', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);

      const result = await service.generateOpenGraphMeta('petition-1');

      expect(result).toEqual({
        title: expect.stringContaining('Test Petition'),
        description: expect.stringContaining('Test Summary'),
        image: 'https://example.com/image.jpg',
        url: 'https://changelib.org/petitions/petition-1',
        type: 'website',
      });
      expect(result.title).toContain('20%');
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      await expect(service.generateOpenGraphMeta('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default OG image when petition has no image', async () => {
      const petitionWithoutImage = { ...mockPetition, imageUrl: null };
      prismaService.petition.findUnique.mockResolvedValue(
        petitionWithoutImage as any,
      );

      const result = await service.generateOpenGraphMeta('petition-1');

      expect(result.image).toBe('https://changelib.org/og-default.png');
    });
  });

  describe('createFacebookShareLink', () => {
    it('should create a Facebook share link and publish event', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.create.mockResolvedValue(mockShareLink as any);

      const result = await service.createFacebookShareLink('petition-1', 'user-1');

      expect(result).toEqual({
        shareUrl: expect.stringContaining('/r/'),
        shortCode: expect.any(String),
        reachEstimate: expect.any(Number),
        prefilledMessage: expect.any(String),
      });
      expect(result.shareUrl).toContain(result.shortCode);
      expect(eventBusService.publish).toHaveBeenCalled();
      expect(prismaService.shareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUrl: 'https://changelib.org/petitions/petition-1',
          petitionId: 'petition-1',
          source: 'facebook',
        }),
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.createFacebookShareLink('invalid', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createFacebookShareLink('petition-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate reach estimate based on trust score', async () => {
      const highTrustUser = { ...mockUser, trustScore: 150 };
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.user.findUnique.mockResolvedValue(highTrustUser as any);
      prismaService.shareLink.create.mockResolvedValue(mockShareLink as any);

      const result = await service.createFacebookShareLink('petition-1', 'user-1');

      expect(result.reachEstimate).toBeGreaterThan(250);
    });
  });

  describe('buildFacebookShareDialog', () => {
    it('should build share dialog config', () => {
      const result = service.buildFacebookShareDialog('petition-1');

      expect(result).toEqual({
        quote: expect.stringContaining('petition'),
        hashtag: expect.stringContaining('#ChangeLiberia'),
        link: 'https://changelib.org/petitions/petition-1',
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
      prismaService.shareLink.findUnique.mockResolvedValue(mockShareLink as any);
      prismaService.shareLink.update.mockResolvedValue(mockShareLink as any);

      const result = await service.trackFacebookClick('abc12345');

      expect(result).toBe(mockShareLink.targetUrl);
      expect(prismaService.shareLink.update).toHaveBeenCalledWith({
        where: { shortCode: 'abc12345' },
        data: expect.objectContaining({
          clickCount: { increment: 1 },
        }),
      });
    });

    it('should throw NotFoundException when share link does not exist', async () => {
      prismaService.shareLink.findUnique.mockResolvedValue(null);

      await expect(service.trackFacebookClick('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordFacebookShare', () => {
    it('should record a Facebook share', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);

      await service.recordFacebookShare('petition-1', 'user-1');

      expect(prismaService.petition.findUnique).toHaveBeenCalledWith({
        where: { id: 'petition-1' },
      });
    });

    it('should update share count when shortCode is provided', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.shareLink.findUnique.mockResolvedValue(mockShareLink as any);

      await service.recordFacebookShare('petition-1', 'user-1', 'abc12345');

      expect(prismaService.shareLink.update).toHaveBeenCalledWith({
        where: { shortCode: 'abc12345' },
        data: expect.objectContaining({
          facebookShareCount: { increment: 1 },
        }),
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

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
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.shareLink.findMany.mockResolvedValue([
        mockShareLink,
        { ...mockShareLink, clickCount: 10, conversions: 3 },
      ] as any);

      const result = await service.getFacebookAnalytics('petition-1');

      expect(result).toEqual({
        totalShares: expect.any(Number),
        totalClicks: expect.any(Number),
        conversions: expect.any(Number),
        conversionRate: expect.any(Number),
        reachEstimate: expect.any(Number),
        topSharers: expect.any(Array),
      });
      expect(result.totalShares).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      await expect(service.getFacebookAnalytics('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCustomAudience', () => {
    it('should get custom audience for sharers', async () => {
      prismaService.shareLink.findMany.mockResolvedValue([
        { ...mockShareLink, referral: { referrerId: 'user-1' } },
      ] as any);

      const result = await service.getCustomAudience('petition-1', 'SHARERS');

      expect(result).toEqual({
        userIds: expect.any(Array),
        estimatedSize: expect.any(Number),
        description: expect.stringContaining('shared'),
      });
    });

    it('should get custom audience for converters', async () => {
      prismaService.shareLink.findMany.mockResolvedValue([] as any);

      const result = await service.getCustomAudience('petition-1', 'CONVERTERS');

      expect(result.description).toContain('shares resulted in');
    });

    it('should get custom audience for influencers', async () => {
      prismaService.shareLink.findMany.mockResolvedValue([] as any);

      const result = await service.getCustomAudience('petition-1', 'INFLUENCERS');

      expect(result.description).toContain('Influencers');
    });
  });
});
