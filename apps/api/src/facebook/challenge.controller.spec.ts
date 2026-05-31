import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';

describe('ChallengeController', () => {
  let app: INestApplication;
  let controller: ChallengeController;
  let challengeService: jest.Mocked<ChallengeService>;

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

  const mockActiveChallenges = [
    {
      id: 'challenge-1',
      title: 'Weekly Share Challenge',
      goalValue: 10,
      goalType: 'share_count',
      daysRemaining: 3,
      rewardMultiplier: 2.0,
      participantCount: 45,
    },
  ];

  const mockUserChallenges = [
    {
      challengeId: 'challenge-1',
      title: 'Weekly Share Challenge',
      progress: 7,
      goalValue: 10,
      percentComplete: 70,
      completed: false,
      daysRemaining: 3,
      earnedBonus: 0,
    },
  ];

  const mockProgress = {
    progress: 8,
    goalValue: 10,
    completed: false,
    percentComplete: 80,
  };

  const mockLeaderboard = [
    {
      userId: 'user-1',
      progress: 10,
      percentComplete: 100,
      rank: 1,
      completed: true,
    },
    {
      userId: 'user-2',
      progress: 8,
      percentComplete: 80,
      rank: 2,
      completed: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeController],
      providers: [
        {
          provide: ChallengeService,
          useValue: {
            getActiveChallenges: jest.fn(),
            getUserChallenges: jest.fn(),
            trackProgress: jest.fn(),
            getChallengeLeaderboard: jest.fn(),
            createCampaignChallenge: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<ChallengeController>(ChallengeController);
    challengeService = module.get(ChallengeService) as jest.Mocked<ChallengeService>;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('getActiveChallenges', () => {
    it('should return active challenges for petition', async () => {
      challengeService.getActiveChallenges.mockResolvedValue(
        mockActiveChallenges as any,
      );

      const result = await controller.getActiveChallenges('petition-1');

      expect(result).toEqual({
        success: true,
        data: {
          petitionId: 'petition-1',
          challenges: mockActiveChallenges,
          count: 1,
        },
      });
      expect(challengeService.getActiveChallenges).toHaveBeenCalledWith(
        'petition-1',
      );
    });

    it('should throw BadRequestException when petitionId missing', async () => {
      await expect(controller.getActiveChallenges('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty challenges on error', async () => {
      challengeService.getActiveChallenges.mockRejectedValue(
        new Error('Error'),
      );

      const result = await controller.getActiveChallenges('petition-1');

      expect(result).toEqual({
        success: true,
        data: {
          petitionId: 'petition-1',
          challenges: [],
          count: 0,
        },
      });
    });
  });

  describe('getUserChallenges', () => {
    it('should return user challenges', async () => {
      challengeService.getUserChallenges.mockResolvedValue(
        mockUserChallenges as any,
      );

      const result = await controller.getUserChallenges(mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          challenges: mockUserChallenges,
          totalCount: 1,
          completedCount: 0,
        },
      });
      expect(challengeService.getUserChallenges).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should count completed challenges', async () => {
      const completedChallenges = [
        { ...mockUserChallenges[0], completed: true },
      ];
      challengeService.getUserChallenges.mockResolvedValue(
        completedChallenges as any,
      );

      const result = await controller.getUserChallenges(mockUser);

      expect(result.data.completedCount).toBe(1);
    });

    it('should return empty challenges on error', async () => {
      challengeService.getUserChallenges.mockRejectedValue(new Error('Error'));

      const result = await controller.getUserChallenges(mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          challenges: [],
          totalCount: 0,
          completedCount: 0,
        },
      });
    });
  });

  describe('trackProgress', () => {
    it('should track progress in a challenge', async () => {
      challengeService.trackProgress.mockResolvedValue(mockProgress as any);

      const result = await controller.trackProgress(
        {
          challengeId: 'challenge-1',
          increment: 1,
        },
        mockUser,
      );

      expect(result).toEqual({
        success: true,
        data: mockProgress,
      });
      expect(challengeService.trackProgress).toHaveBeenCalledWith(
        'user-1',
        'challenge-1',
        1,
      );
    });

    it('should use default increment of 1', async () => {
      challengeService.trackProgress.mockResolvedValue(mockProgress as any);

      await controller.trackProgress(
        {
          challengeId: 'challenge-1',
        },
        mockUser,
      );

      expect(challengeService.trackProgress).toHaveBeenCalledWith(
        'user-1',
        'challenge-1',
        1,
      );
    });

    it('should throw BadRequestException when challengeId missing', async () => {
      await expect(
        controller.trackProgress(
          {
            challengeId: '',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate increment bounds', async () => {
      await expect(
        controller.trackProgress(
          {
            challengeId: 'challenge-1',
            increment: 0,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.trackProgress(
          {
            challengeId: 'challenge-1',
            increment: 2000,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when challenge not found', async () => {
      challengeService.trackProgress.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(
        controller.trackProgress(
          {
            challengeId: 'invalid',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should return challenge leaderboard', async () => {
      challengeService.getChallengeLeaderboard.mockResolvedValue(
        mockLeaderboard as any,
      );

      const result = await controller.getChallengeLeaderboard('challenge-1');

      expect(result).toEqual({
        success: true,
        data: {
          challengeId: 'challenge-1',
          leaderboard: mockLeaderboard,
          count: 2,
        },
      });
      expect(challengeService.getChallengeLeaderboard).toHaveBeenCalledWith(
        'challenge-1',
        10,
      );
    });

    it('should throw BadRequestException when challengeId missing', async () => {
      await expect(controller.getChallengeLeaderboard('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should respect custom limit parameter', async () => {
      challengeService.getChallengeLeaderboard.mockResolvedValue([]);

      await controller.getChallengeLeaderboard('challenge-1', '25');

      expect(challengeService.getChallengeLeaderboard).toHaveBeenCalledWith(
        'challenge-1',
        25,
      );
    });

    it('should cap limit at 100', async () => {
      challengeService.getChallengeLeaderboard.mockResolvedValue([]);

      await controller.getChallengeLeaderboard('challenge-1', '500');

      expect(challengeService.getChallengeLeaderboard).toHaveBeenCalledWith(
        'challenge-1',
        100,
      );
    });

    it('should throw NotFoundException when challenge not found', async () => {
      challengeService.getChallengeLeaderboard.mockRejectedValue(
        new NotFoundException('Not found'),
      );

      await expect(
        controller.getChallengeLeaderboard('invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChallengeHistory', () => {
    it('should return completed challenges history', async () => {
      const completedChallenges = [
        { ...mockUserChallenges[0], completed: true, earnedBonus: 2.0 },
      ];
      challengeService.getUserChallenges.mockResolvedValue(
        completedChallenges as any,
      );

      const result = await controller.getChallengeHistory(mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          completedChallenges,
          totalEarnings: 2.0,
          count: 1,
        },
      });
    });

    it('should calculate total earnings from completed challenges', async () => {
      const completedChallenges = [
        { ...mockUserChallenges[0], completed: true, earnedBonus: 2.0 },
        { ...mockUserChallenges[0], completed: true, earnedBonus: 3.0 },
      ];
      challengeService.getUserChallenges.mockResolvedValue(
        completedChallenges as any,
      );

      const result = await controller.getChallengeHistory(mockUser);

      expect(result.data.totalEarnings).toBe(5.0);
    });

    it('should return empty history on error', async () => {
      challengeService.getUserChallenges.mockRejectedValue(new Error('Error'));

      const result = await controller.getChallengeHistory(mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          userId: 'user-1',
          completedChallenges: [],
          totalEarnings: 0,
          count: 0,
        },
      });
    });
  });

  describe('createChallenge', () => {
    it('should create a campaign challenge', async () => {
      const challengeData = {
        petitionId: 'petition-1',
        title: 'Campaign Challenge',
        goalValue: 15,
        goalType: 'share_count' as const,
        startDate: '2026-04-13T00:00:00Z',
        endDate: '2026-04-20T23:59:59Z',
        rewardMultiplier: 3.0,
      };

      const createdChallenge = {
        id: 'challenge-1',
        title: 'Campaign Challenge',
        goalValue: 15,
      };
      challengeService.createCampaignChallenge.mockResolvedValue(
        createdChallenge as any,
      );

      const result = await controller.createChallenge(
        challengeData,
        mockAdminUser,
      );

      expect(result).toEqual({
        success: true,
        data: createdChallenge,
      });
      expect(challengeService.createCampaignChallenge).toHaveBeenCalledWith(
        'petition-1',
        'Campaign Challenge',
        15,
        'share_count',
        new Date('2026-04-13T00:00:00Z'),
        new Date('2026-04-20T23:59:59Z'),
        3.0,
      );
    });

    it('should throw BadRequestException when required fields missing', async () => {
      await expect(
        controller.createChallenge(
          {
            petitionId: '',
            title: 'Challenge',
            goalValue: 10,
            goalType: 'share_count' as const,
            startDate: '2026-04-13T00:00:00Z',
            endDate: '2026-04-20T23:59:59Z',
            rewardMultiplier: 2.0,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate date format', async () => {
      await expect(
        controller.createChallenge(
          {
            petitionId: 'petition-1',
            title: 'Challenge',
            goalValue: 10,
            goalType: 'share_count' as const,
            startDate: 'invalid-date',
            endDate: '2026-04-20T23:59:59Z',
            rewardMultiplier: 2.0,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when petition not found', async () => {
      challengeService.createCampaignChallenge.mockRejectedValue(
        new NotFoundException('Petition not found'),
      );

      await expect(
        controller.createChallenge(
          {
            petitionId: 'invalid',
            title: 'Challenge',
            goalValue: 10,
            goalType: 'share_count' as const,
            startDate: '2026-04-13T00:00:00Z',
            endDate: '2026-04-20T23:59:59Z',
            rewardMultiplier: 2.0,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
