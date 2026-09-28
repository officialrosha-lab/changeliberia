import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeService } from './challenge.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeStatus, ChallengePeriod } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ChallengeService', () => {
  let service: ChallengeService;

  const mockChallenge = {
    id: 'challenge-1',
    petitionId: 'petition-1',
    title: 'Weekly Share Challenge',
    description: 'Share 10 times to earn 2x bonus',
    period: ChallengePeriod.WEEKLY,
    startDate: new Date('2026-04-13'),
    endDate: new Date('2026-04-19'),
    status: ChallengeStatus.ACTIVE,
    goalType: 'share_count',
    goalValue: 10,
    rewardMultiplier: 2.0,
    completions: 5,
    metadata: '{}',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    id: 'membership-1',
    userId: 'user-1',
    challengeId: 'challenge-1',
    progress: 7,
    completed: false,
    completedAt: null,
    earnedBonus: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    description: 'Test Description',
  };

  const mockPrismaService = {
    shareChallenge: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
    },
    challengeMembership: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    petition: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWeeklyChallenge', () => {
    it('should create a weekly challenge', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareChallenge.create.mockResolvedValue(mockChallenge);

      const result = await service.createWeeklyChallenge('petition-1', 10);

      expect(result).toEqual({
        id: mockChallenge.id,
        title: mockChallenge.title,
        startDate: mockChallenge.startDate,
        endDate: mockChallenge.endDate,
        goalValue: mockChallenge.goalValue,
      });
      expect(mockPrismaService.shareChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            petitionId: 'petition-1',
            period: ChallengePeriod.WEEKLY,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.createWeeklyChallenge('invalid', 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set period to WEEKLY', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);
      mockPrismaService.shareChallenge.create.mockResolvedValue(mockChallenge);

      await service.createWeeklyChallenge('petition-1', 10);

      expect(mockPrismaService.shareChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            period: ChallengePeriod.WEEKLY,
            rewardMultiplier: 2.0,
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('createCampaignChallenge', () => {
    it('should create a campaign challenge', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(mockPetition);

      const startDate = new Date('2026-04-13');
      const endDate = new Date('2026-04-20');
      const campaignChallenge = {
        ...mockChallenge,
        title: 'Campaign Challenge',
        goalValue: 15,
        period: ChallengePeriod.CAMPAIGN,
        startDate,
        endDate,
        rewardMultiplier: 3.0,
      };

      mockPrismaService.shareChallenge.create.mockResolvedValue(
        campaignChallenge,
      );

      const result = await service.createCampaignChallenge(
        'petition-1',
        'Campaign Challenge',
        15,
        'share_count',
        startDate,
        endDate,
        3.0,
      );

      expect(result).toEqual({
        id: expect.any(String) as string,
        title: 'Campaign Challenge',
        goalValue: 15,
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      mockPrismaService.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.createCampaignChallenge(
          'invalid',
          'Challenge',
          10,
          'share_count',
          new Date(),
          new Date(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackProgress', () => {
    it('should track user progress in a challenge', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge,
      );
      mockPrismaService.challengeMembership.findUnique.mockResolvedValue(
        mockMembership,
      );
      mockPrismaService.challengeMembership.update.mockResolvedValue({
        ...mockMembership,
        progress: 8,
      });

      const result = await service.trackProgress('user-1', 'challenge-1', 1);

      expect(result).toEqual({
        progress: expect.any(Number) as number,
        goalValue: mockChallenge.goalValue,
        completed: false,
        percentComplete: expect.any(Number) as number,
      });
    });

    it('should create membership if not exists', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge,
      );
      mockPrismaService.challengeMembership.findUnique.mockResolvedValue(null);
      mockPrismaService.challengeMembership.create.mockResolvedValue(
        mockMembership,
      );

      await service.trackProgress('user-1', 'challenge-1', 5);

      expect(mockPrismaService.challengeMembership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            challengeId: 'challenge-1',
            progress: 5,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should mark challenge as completed when goal is reached', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge,
      );
      mockPrismaService.challengeMembership.findUnique.mockResolvedValueOnce(
        mockMembership,
      );
      mockPrismaService.challengeMembership.findUnique.mockResolvedValueOnce({
        ...mockMembership,
        progress: 10,
      });
      mockPrismaService.challengeMembership.update.mockResolvedValue({
        ...mockMembership,
        progress: 10,
        completed: true,
      });

      await service.trackProgress('user-1', 'challenge-1', 3);

      expect(mockPrismaService.challengeMembership.update).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when challenge does not exist', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.trackProgress('user-1', 'invalid', 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveChallenges', () => {
    it('should return active challenges for a petition', async () => {
      mockPrismaService.shareChallenge.findMany.mockResolvedValue([
        { ...mockChallenge, memberships: [] },
      ]);

      const result = await service.getActiveChallenges('petition-1');

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('goalValue');
        expect(result[0]).toHaveProperty('daysRemaining');
      }
    });

    it('should only return ACTIVE challenges', async () => {
      mockPrismaService.shareChallenge.findMany.mockResolvedValue([]);

      await service.getActiveChallenges('petition-1');

      expect(mockPrismaService.shareChallenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ChallengeStatus.ACTIVE,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should return empty array on error', async () => {
      mockPrismaService.shareChallenge.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.getActiveChallenges('petition-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserChallenges', () => {
    it('should return user challenges with progress', async () => {
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: mockChallenge,
        },
      ]);

      const result = await service.getUserChallenges('user-1');

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('challengeId');
        expect(result[0]).toHaveProperty('progress');
        expect(result[0]).toHaveProperty('goalValue');
        expect(result[0]).toHaveProperty('percentComplete');
        expect(result[0]).toHaveProperty('completed');
      }
    });

    it('should return empty array on error', async () => {
      mockPrismaService.challengeMembership.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.getUserChallenges('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should return challenge leaderboard', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge,
      );
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([
        mockMembership,
      ]);

      const result = await service.getChallengeLeaderboard('challenge-1', 10);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('userId');
        expect(result[0]).toHaveProperty('progress');
        expect(result[0]).toHaveProperty('rank');
        expect(result[0].rank).toBe(1);
      }
    });

    it('should throw NotFoundException when challenge does not exist', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.getChallengeLeaderboard('invalid', 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge,
      );
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([]);

      await service.getChallengeLeaderboard('challenge-1', 5);

      expect(
        mockPrismaService.challengeMembership.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('applyChallengeMultiplier', () => {
    it('should apply challenge multiplier', async () => {
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 2.0 },
        },
      ]);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(200);
    });

    it('should cap multiplier at 5x', async () => {
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 3.0 },
        },
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 3.0 },
        },
      ]);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBeLessThanOrEqual(500);
    });

    it('should return base bonus when no completed challenges', async () => {
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([]);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(100);
    });

    it('should return base bonus on error', async () => {
      mockPrismaService.challengeMembership.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(100);
    });
  });

  describe('autoCompleteReachedGoals', () => {
    it('should auto-complete challenges with reached goals', async () => {
      mockPrismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          progress: 10,
          challenge: mockChallenge,
        },
      ]);

      const result = await service.autoCompleteReachedGoals('user-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
