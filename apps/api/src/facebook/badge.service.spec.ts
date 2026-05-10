import { Test, TestingModule } from '@nestjs/testing';
import { BadgeService } from './badge.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BadgeService', () => {
  let service: BadgeService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    trustScore: 75,
  };

  const mockBadge = {
    id: 'badge-1',
    userId: 'user-1',
    petitionId: 'petition-1',
    badgeType: 'SHARE_WIZARD' as const,
    multiplierBonus: 2.0,
    earnedAt: new Date(),
    metadata: '{}',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    conversions: 5,
    clickCount: 10,
    networkReachEstimate: 250,
    lastClickedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        {
          provide: PrismaService,
          useValue: {
            shareLink: {
              count: jest.fn().mockResolvedValue(0) as any,
              aggregate: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
            },
            socialEngagementBadge: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              create: jest.fn().mockResolvedValue(null) as any,
            },
            referral: {
              findMany: jest.fn().mockResolvedValue([]) as any,
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
            },
          },
        },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('checkAndAwardBadges', () => {
    it('should award new badges to user', async () => {
      prismaService.socialEngagementBadge.findUnique.mockResolvedValue(null);
      prismaService.shareLink.count.mockResolvedValue(10);
      prismaService.shareLink.aggregate.mockResolvedValue({
        _sum: { conversions: 50 },
      } as any);
      prismaService.socialEngagementBadge.create.mockResolvedValue(
        mockBadge as any,
      );

      const result = await service.checkAndAwardBadges('user-1', 'petition-1');

      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.socialEngagementBadge.create).toHaveBeenCalled();
    });

    it('should not re-award already earned badges', async () => {
      prismaService.socialEngagementBadge.findUnique.mockResolvedValue(
        mockBadge as any,
      );

      const result = await service.checkAndAwardBadges('user-1', 'petition-1');

      expect(prismaService.socialEngagementBadge.create).not.toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      prismaService.socialEngagementBadge.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.checkAndAwardBadges('user-1', 'petition-1');

      expect(result).toEqual([]);
    });
  });

  describe('applyBadgeMultiplier', () => {
    it('should apply multiplicative badge multiplier', async () => {
      prismaService.socialEngagementBadge.findMany.mockResolvedValue([
        { ...mockBadge, multiplierBonus: 2.0 },
        { ...mockBadge, multiplierBonus: 1.5 },
      ] as any);

      const result = await service.applyBadgeMultiplier('user-1', 'petition-1', 100);

      expect(result).toBe(Math.floor(100 * 2.0 * 1.5));
    });

    it('should cap multiplier at 5x', async () => {
      prismaService.socialEngagementBadge.findMany.mockResolvedValue([
        { ...mockBadge, multiplierBonus: 3.0 },
        { ...mockBadge, multiplierBonus: 3.0 },
      ] as any);

      const result = await service.applyBadgeMultiplier('user-1', 'petition-1', 100);

      expect(result).toBeLessThanOrEqual(500);
    });

    it('should return base bonus on error', async () => {
      prismaService.socialEngagementBadge.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.applyBadgeMultiplier('user-1', 'petition-1', 100);

      expect(result).toBe(100);
    });
  });

  describe('getUserBadges', () => {
    it('should return user badges for a petition', async () => {
      prismaService.socialEngagementBadge.findMany.mockResolvedValue([
        mockBadge,
      ] as any);

      const result = await service.getUserBadges('user-1', 'petition-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(prismaService.socialEngagementBadge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            petitionId: 'petition-1',
          }),
        }),
      );
    });

    it('should return all user badges when no petition specified', async () => {
      prismaService.socialEngagementBadge.findMany.mockResolvedValue([
        mockBadge,
      ] as any);

      const result = await service.getUserBadges('user-1');

      expect(prismaService.socialEngagementBadge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('getBadgeProgress', () => {
    it('should return progress for SHARE_WIZARD badge', async () => {
      prismaService.shareLink.count.mockResolvedValue(7);

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'SHARE_WIZARD',
      );

      expect(result).toEqual({
        badgeType: 'SHARE_WIZARD',
        progress: 7,
        target: 10,
        percentComplete: 70,
      });
    });

    it('should return progress for VIRAL_HERO badge', async () => {
      prismaService.shareLink.aggregate.mockResolvedValue({
        _sum: { conversions: 30 },
      } as any);

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'VIRAL_HERO',
      );

      expect(result.badgeType).toBe('VIRAL_HERO');
      expect(result.progress).toBe(30);
      expect(result.target).toBe(50);
    });

    it('should return progress for NETWORK_BUILDER badge', async () => {
      prismaService.referral.findMany.mockResolvedValue(
        Array(75)
          .fill(null)
          .map((_, i) => ({
            id: `referral-${i}`,
            referrerId: 'user-1',
            refereeEmail: `user${i}@example.com`,
            petitionId: 'petition-1',
          })) as any,
      );

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'NETWORK_BUILDER',
      );

      expect(result.badgeType).toBe('NETWORK_BUILDER');
      expect(result.progress).toBe(75);
      expect(result.percentComplete).toBe(75);
    });

    it('should return progress for INFLUENCER badge', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.shareLink.aggregate.mockResolvedValue({
        _sum: { conversions: 15 },
      } as any);

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'INFLUENCER',
      );

      expect(result.badgeType).toBe('INFLUENCER');
      expect(typeof result.progress).toBe('number');
    });

    it('should return progress for STREAK_MASTER badge', async () => {
      prismaService.shareLink.findMany.mockResolvedValue([
        { ...mockShareLink, createdAt: new Date('2026-04-13') },
        { ...mockShareLink, createdAt: new Date('2026-04-14') },
        { ...mockShareLink, createdAt: new Date('2026-04-15') },
        { ...mockShareLink, createdAt: new Date('2026-04-16') },
        { ...mockShareLink, createdAt: new Date('2026-04-17') },
      ] as any);

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'STREAK_MASTER',
      );

      expect(result.badgeType).toBe('STREAK_MASTER');
      expect(result.progress).toBe(5);
      expect(result.target).toBe(5);
    });

    it('should return zero progress on error', async () => {
      prismaService.shareLink.count.mockRejectedValue(new Error('DB error'));

      const result = await service.getBadgeProgress(
        'user-1',
        'petition-1',
        'SHARE_WIZARD',
      );

      expect(result.progress).toBe(0);
      expect(result.percentComplete).toBe(0);
    });
  });

  describe('getBadgeLeaderboard', () => {
    it('should return badge leaderboard', async () => {
      prismaService.user.findMany.mockResolvedValue([
        {
          ...mockUser,
          badges: [
            { ...mockBadge, multiplierBonus: 2.0 },
            { ...mockBadge, multiplierBonus: 1.5 },
          ],
        },
      ] as any);

      const result = await service.getBadgeLeaderboard(10);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('userId');
        expect(result[0]).toHaveProperty('badgeCount');
        expect(result[0]).toHaveProperty('totalMultiplier');
      }
    });

    it('should respect limit parameter', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      await service.getBadgeLeaderboard(5);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should return empty array on error', async () => {
      prismaService.user.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.getBadgeLeaderboard();

      expect(result).toEqual([]);
    });
  });
});
