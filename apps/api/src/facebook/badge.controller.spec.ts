import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';

describe('BadgeController', () => {
  let app: INestApplication;
  let controller: BadgeController;
  let badgeService: jest.Mocked<BadgeService>;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    role: 'user',
  };

  const mockAdminUser = {
    id: 'admin-1',
    name: 'Admin User',
    role: 'admin',
  };

  const mockBadges = {
    SHARE_WIZARD: {
      description: '10+ shares on a single petition',
      multiplier: 2.0,
    },
    VIRAL_HERO: {
      description: '50+ conversions from your shares',
      multiplier: 3.0,
    },
  };

  const mockUserBadges = [
    {
      badgeType: 'SHARE_WIZARD',
      earnedAt: new Date(),
      multiplier: 2.0,
      petitionId: 'petition-1',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeController],
      providers: [
        {
          provide: BadgeService,
          useValue: {
            getBadgeDescriptions: jest.fn(),
            getUserBadges: jest.fn(),
            getBadgeProgress: jest.fn(),
            getBadgeLeaderboard: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<BadgeController>(BadgeController);
    badgeService = module.get(BadgeService) as jest.Mocked<BadgeService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('getAllBadges', () => {
    it('should return all badge descriptions', () => {
      badgeService.getBadgeDescriptions.mockReturnValue(mockBadges as any);

      const result = controller.getAllBadges();

      expect(result).toEqual({
        success: true,
        data: {
          badges: mockBadges,
          count: 2,
        },
      });
    });

    it('should return empty badges on error', () => {
      badgeService.getBadgeDescriptions.mockImplementation(() => {
        throw new Error('Error');
      });

      const result = controller.getAllBadges();

      expect(result).toEqual({
        success: true,
        data: {
          badges: {},
          count: 0,
        },
      });
    });
  });

  describe('getUserBadges', () => {
    it('should return user badges', async () => {
      badgeService.getUserBadges.mockResolvedValue(mockUserBadges as any);

      const result = await controller.getUserBadges('user-1');

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          badges: mockUserBadges,
          count: 1,
          totalMultiplier: 2.0,
        },
      });
      expect(badgeService.getUserBadges).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
    });

    it('should filter by petitionId if provided', async () => {
      badgeService.getUserBadges.mockResolvedValue(mockUserBadges as any);

      await controller.getUserBadges('user-1', 'petition-1');

      expect(badgeService.getUserBadges).toHaveBeenCalledWith(
        'user-1',
        'petition-1',
      );
    });

    it('should throw BadRequestException when userId missing', async () => {
      await expect(controller.getUserBadges('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty badges on error', async () => {
      badgeService.getUserBadges.mockRejectedValue(new Error('Error'));

      const result = await controller.getUserBadges('user-1');

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          badges: [],
          count: 0,
          totalMultiplier: 1,
        },
      });
    });
  });

  describe('getBadgeProgress', () => {
    it('should return badge progress for own user', async () => {
      const progress = {
        badgeType: 'SHARE_WIZARD',
        progress: 7,
        target: 10,
        percentComplete: 70,
      };
      badgeService.getBadgeProgress.mockResolvedValue(progress as any);

      const result = await controller.getBadgeProgress(
        'user-1',
        'petition-1',
        'SHARE_WIZARD',
        mockUser,
      );

      expect(result).toEqual({
        success: true,
        data: progress,
      });
    });

    it('should allow admin to view other users progress', async () => {
      const progress = {
        badgeType: 'SHARE_WIZARD',
        progress: 7,
        target: 10,
        percentComplete: 70,
      };
      badgeService.getBadgeProgress.mockResolvedValue(progress as any);

      await controller.getBadgeProgress(
        'user-2',
        'petition-1',
        'SHARE_WIZARD',
        mockAdminUser,
      );

      expect(badgeService.getBadgeProgress).toHaveBeenCalled();
    });

    it('should prevent user from viewing other users progress', async () => {
      await expect(
        controller.getBadgeProgress(
          'user-2',
          'petition-1',
          'SHARE_WIZARD',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when parameters missing', async () => {
      await expect(
        controller.getBadgeProgress('', 'petition-1', 'SHARE_WIZARD', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException on service error', async () => {
      badgeService.getBadgeProgress.mockRejectedValue(new Error('Error'));

      await expect(
        controller.getBadgeProgress(
          'user-1',
          'petition-1',
          'SHARE_WIZARD',
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBadgeLeaderboard', () => {
    it('should return badge leaderboard with default limit', async () => {
      const leaderboard = [
        {
          userId: 'user-1',
          badgeCount: 5,
          totalMultiplier: 2.5,
          topBadges: ['SHARE_WIZARD'],
        },
      ];
      badgeService.getBadgeLeaderboard.mockResolvedValue(leaderboard as any);

      const result = await controller.getBadgeLeaderboard();

      expect(result).toEqual({
        success: true,
        data: {
          leaderboard,
          count: 1,
          period: 'all-time',
        },
      });
      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(10);
    });

    it('should respect custom limit parameter', async () => {
      badgeService.getBadgeLeaderboard.mockResolvedValue([]);

      await controller.getBadgeLeaderboard('25');

      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(25);
    });

    it('should cap limit at 100', async () => {
      badgeService.getBadgeLeaderboard.mockResolvedValue([]);

      await controller.getBadgeLeaderboard('500');

      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(100);
    });

    it('should return empty leaderboard on error', async () => {
      badgeService.getBadgeLeaderboard.mockRejectedValue(new Error('Error'));

      const result = await controller.getBadgeLeaderboard();

      expect(result).toEqual({
        success: true,
        data: {
          leaderboard: [],
          count: 0,
          period: 'all-time',
        },
      });
    });
  });

  describe('getPetitionBadges', () => {
    it('should return badge leaderboard for petition', async () => {
      badgeService.getBadgeLeaderboard.mockResolvedValue([]);

      const result = await controller.getPetitionBadges('petition-1');

      expect(result).toEqual({
        success: true,
        data: {
          petitionId: 'petition-1',
          leaderboard: [],
          count: 0,
        },
      });
    });

    it('should throw BadRequestException when petitionId missing', async () => {
      await expect(controller.getPetitionBadges('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should respect limit parameter', async () => {
      badgeService.getBadgeLeaderboard.mockResolvedValue([]);

      await controller.getPetitionBadges('petition-1', '15');

      expect(badgeService.getBadgeLeaderboard).toHaveBeenCalledWith(15);
    });
  });
});
