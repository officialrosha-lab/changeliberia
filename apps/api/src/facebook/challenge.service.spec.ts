import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeService } from './challenge.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeStatus, ChallengePeriod, NotFoundException } from '@prisma/client';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let prismaService: jest.Mocked<PrismaService>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: PrismaService,
          useValue: {
            shareChallenge: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            challengeMembership: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            petition: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  describe('createWeeklyChallenge', () => {
    it('should create a weekly challenge', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.shareChallenge.create.mockResolvedValue(mockChallenge as any);

      const result = await service.createWeeklyChallenge('petition-1', 10);

      expect(result).toEqual({
        id: mockChallenge.id,
        title: mockChallenge.title,
        startDate: mockChallenge.startDate,
        endDate: mockChallenge.endDate,
        goalValue: mockChallenge.goalValue,
      });
      expect(prismaService.shareChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            petitionId: 'petition-1',
            period: ChallengePeriod.WEEKLY,
          }),
        }),
      );
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

      await expect(service.createWeeklyChallenge('invalid', 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set period to WEEKLY', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.shareChallenge.create.mockResolvedValue(mockChallenge as any);

      await service.createWeeklyChallenge('petition-1', 10);

      expect(prismaService.shareChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            period: ChallengePeriod.WEEKLY,
            rewardMultiplier: 2.0,
          }),
        }),
      );
    });
  });

  describe('createCampaignChallenge', () => {
    it('should create a campaign challenge', async () => {
      prismaService.petition.findUnique.mockResolvedValue(mockPetition as any);
      prismaService.shareChallenge.create.mockResolvedValue({
        ...mockChallenge,
        period: ChallengePeriod.CAMPAIGN,
      } as any);

      const startDate = new Date('2026-04-13');
      const endDate = new Date('2026-04-20');

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
        id: expect.any(String),
        title: 'Campaign Challenge',
        goalValue: 15,
      });
    });

    it('should throw NotFoundException when petition does not exist', async () => {
      prismaService.petition.findUnique.mockResolvedValue(null);

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
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findUnique.mockResolvedValue(
        mockMembership as any,
      );
      prismaService.challengeMembership.update.mockResolvedValue({
        ...mockMembership,
        progress: 8,
      } as any);

      const result = await service.trackProgress('user-1', 'challenge-1', 1);

      expect(result).toEqual({
        progress: expect.any(Number),
        goalValue: mockChallenge.goalValue,
        completed: false,
        percentComplete: expect.any(Number),
      });
    });

    it('should create membership if not exists', async () => {
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findUnique.mockResolvedValue(null);
      prismaService.challengeMembership.create.mockResolvedValue(
        mockMembership as any,
      );

      await service.trackProgress('user-1', 'challenge-1', 5);

      expect(prismaService.challengeMembership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            challengeId: 'challenge-1',
            progress: 5,
          }),
        }),
      );
    });

    it('should mark challenge as completed when goal is reached', async () => {
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findUnique.mockResolvedValueOnce(
        mockMembership as any,
      );
      prismaService.challengeMembership.findUnique.mockResolvedValueOnce(
        { ...mockMembership, progress: 10 } as any,
      );
      prismaService.challengeMembership.update.mockResolvedValue({
        ...mockMembership,
        progress: 10,
        completed: true,
      } as any);

      const result = await service.trackProgress('user-1', 'challenge-1', 3);

      expect(prismaService.challengeMembership.update).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when challenge does not exist', async () => {
      prismaService.shareChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.trackProgress('user-1', 'invalid', 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveChallenges', () => {
    it('should return active challenges for a petition', async () => {
      prismaService.shareChallenge.findMany.mockResolvedValue([
        { ...mockChallenge, memberships: [] },
      ] as any);

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
      prismaService.shareChallenge.findMany.mockResolvedValue([]);

      await service.getActiveChallenges('petition-1');

      expect(prismaService.shareChallenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ChallengeStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should return empty array on error', async () => {
      prismaService.shareChallenge.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.getActiveChallenges('petition-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserChallenges', () => {
    it('should return user challenges with progress', async () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: mockChallenge,
        },
      ] as any);

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
      prismaService.challengeMembership.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.getUserChallenges('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should return challenge leaderboard', async () => {
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findMany.mockResolvedValue([
        mockMembership,
      ] as any);

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
      prismaService.shareChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.getChallengeLeaderboard('invalid', 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('should respect limit parameter', async () => {
      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.challengeMembership.findMany.mockResolvedValue([]);

      await service.getChallengeLeaderboard('challenge-1', 5);

      expect(prismaService.challengeMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('applyChallengeMultiplier', () => {
    it('should apply challenge multiplier', async () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 2.0 },
        },
      ] as any);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(200);
    });

    it('should cap multiplier at 5x', async () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 3.0 },
        },
        {
          ...mockMembership,
          challenge: { ...mockChallenge, rewardMultiplier: 3.0 },
        },
      ] as any);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBeLessThanOrEqual(500);
    });

    it('should return base bonus when no completed challenges', async () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([]);

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(100);
    });

    it('should return base bonus on error', async () => {
      prismaService.challengeMembership.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.applyChallengeMultiplier('user-1', 100);

      expect(result).toBe(100);
    });
  });

  describe('autoCompleteReachedGoals', () => {
    it('should auto-complete challenges with reached goals', async () => {
      prismaService.challengeMembership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          progress: 10,
          challenge: mockChallenge,
        },
      ] as any);

      const result = await service.autoCompleteReachedGoals('user-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
