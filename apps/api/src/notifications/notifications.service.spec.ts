import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadgeUnlockedEvent,
  ChallengeCompletedEvent,
} from '../events/domain-events';

// `expect.objectContaining` is typed to return `any`, so nesting it as the
// value of an object literal property trips no-unsafe-assignment. This
// wraps it with the sample's own inferred type so the matcher stays
// type-safe at the call site.
function matching<T extends object>(sample: T): T {
  return expect.objectContaining(sample) as unknown as T;
}

/**
 * Notifications Service Unit Tests
 * Tests notification creation, badge/challenge events, and preferences
 */
describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    creatorId: 'creator-1',
  };

  const mockChallenge = {
    id: 'challenge-1',
    title: 'Share Challenge',
    goalValue: 10,
    rewardMultiplier: 2.0,
  };

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    petition: {
      findUnique: jest.fn(),
    },
    shareChallenge: {
      findUnique: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    content: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = moduleFixture.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const payload = {
        type: 'BADGE_UNLOCKED',
        title: 'Badge Unlocked',
        message: 'You unlocked a badge',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        ...payload,
        metadata: null,
        status: 'UNREAD',
        createdAt: new Date(),
      } as any);

      const result = (await service.createNotification(
        'user-1',
        payload,
      )) as Record<string, unknown>;

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'BADGE_UNLOCKED',
          title: 'Badge Unlocked',
          message: 'You unlocked a badge',
          actionUrl: undefined,
          actionLabel: undefined,
          metadata: null,
        },
      });
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
    });

    it('should handle metadata in notification', async () => {
      const payload = {
        type: 'BADGE_UNLOCKED',
        title: 'Badge Unlocked',
        message: 'You unlocked a badge',
        metadata: { badgeType: 'SHARE_WIZARD' },
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        ...payload,
        status: 'UNREAD',
        createdAt: new Date(),
      } as any);

      const result = (await service.createNotification(
        'user-1',
        payload,
      )) as Record<string, unknown>;

      expect(result).toBeDefined();
      expect(result.metadata).toEqual({ badgeType: 'SHARE_WIZARD' });
    });
  });

  describe('Badge Unlock Notifications', () => {
    it('should handle badge unlocked event', async () => {
      const event = {
        userId: 'user-1',
        badgeType: 'SHARE_WIZARD',
        petitionId: 'petition-1',
      } as unknown as BadgeUnlockedEvent;

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleBadgeUnlocked(event);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: matching({
          userId: 'user-1',
          type: 'BADGE_UNLOCKED',
          title: expect.stringContaining('Share Wizard') as string,
        }),
      });
    });

    it('should send badge notification for all badge types', async () => {
      const badgeTypes = [
        'SHARE_WIZARD',
        'VIRAL_HERO',
        'NETWORK_BUILDER',
        'INFLUENCER',
        'STREAK_MASTER',
      ];

      for (const badgeType of badgeTypes) {
        const event = {
          userId: 'user-1',
          badgeType: badgeType,
          petitionId: 'petition-1',
        } as unknown as BadgeUnlockedEvent;

        mockPrisma.notification.create.mockResolvedValue({
          id: 'notif-1',
        } as any);

        await service.handleBadgeUnlocked(event);

        expect(mockPrisma.notification.create).toHaveBeenCalled();
      }
    });
  });

  describe('Challenge Completion Notifications', () => {
    it('should handle challenge completed event', async () => {
      const event = {
        userId: 'user-1',
        challengeId: 'challenge-1',
        petitionId: 'petition-1',
      } as unknown as ChallengeCompletedEvent;

      mockPrisma.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleChallengeCompleted(event);

      expect(mockPrisma.shareChallenge.findUnique).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        select: { title: true, rewardMultiplier: true },
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: matching({
          userId: 'user-1',
          type: 'CHALLENGE_COMPLETED',
          title: expect.stringContaining('Share Challenge') as string,
        }),
      });
    });

    it('should include reward multiplier in challenge notification', async () => {
      const event = {
        userId: 'user-1',
        challengeId: 'challenge-1',
        petitionId: 'petition-1',
      } as unknown as ChallengeCompletedEvent;

      mockPrisma.shareChallenge.findUnique.mockResolvedValue({
        title: 'Advanced Challenge',
        rewardMultiplier: 3.0,
      } as any);
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleChallengeCompleted(event);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: matching({
          message: expect.stringContaining('3x') as string,
          metadata: expect.stringContaining('"rewardMultiplier":3') as string,
        }),
      });
    });

    it('should handle missing challenge gracefully', async () => {
      const event = {
        userId: 'user-1',
        challengeId: 'challenge-999',
        petitionId: 'petition-1',
      } as unknown as ChallengeCompletedEvent;

      mockPrisma.shareChallenge.findUnique.mockResolvedValue(null);

      // Should not throw, just log warning
      await service.handleChallengeCompleted(event);

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Mark Notification As Read', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({
        count: 1,
      } as any);

      await service.markAsRead('notif-1', 'user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: {
          status: 'READ',
          readAt: expect.any(Date) as Date,
        },
      });
    });
  });

  describe('Mark All Notifications As Read', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({
        count: 5,
      } as any);

      await service.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        data: {
          status: 'READ',
          readAt: expect.any(Date) as Date,
        },
      });
    });
  });

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({
        count: 1,
      } as any);

      await service.deleteNotification('notif-1', 'user-1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });
  });

  describe('Get Unread Notifications', () => {
    it('should get unread notifications with limit', async () => {
      const mockNotifications = [
        { id: 'notif-1', type: 'BADGE_UNLOCKED', status: 'UNREAD' },
        { id: 'notif-2', type: 'CHALLENGE_COMPLETED', status: 'UNREAD' },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(
        mockNotifications as any,
      );

      const result = await service.getUnreadNotifications('user-1', 20);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });

      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('should default to limit of 10', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.getUnreadNotifications('user-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should get user notification preferences', async () => {
      const mockPrefs = {
        userId: 'user-1',
        badges: true,
        challenges: true,
        email: true,
        sms: false,
      };

      mockPrisma.notificationPreference.findUnique.mockResolvedValue(
        mockPrefs as any,
      );

      const result = await service.getPreferences('user-1');

      expect(mockPrisma.notificationPreference.findUnique).toHaveBeenCalledWith(
        { where: { userId: 'user-1' } },
      );
      expect(result).toEqual(mockPrefs);
    });

    it('should update user notification preferences', async () => {
      const updatedPrefs = {
        userId: 'user-1',
        inAppEnabled: false,
        emailEnabled: false,
        pushEnabled: true,
      };

      mockPrisma.notificationPreference.upsert.mockResolvedValue(
        updatedPrefs as any,
      );

      const result = await service.updatePreferences('user-1', {
        inAppEnabled: false,
        emailEnabled: false,
        pushEnabled: true,
      });

      expect(mockPrisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: matching({ userId: 'user-1' }),
        update: {
          inAppEnabled: false,
          emailEnabled: false,
          pushEnabled: true,
        },
      });

      expect(result).toEqual(updatedPrefs);
    });
  });

  describe('Share Milestone Notifications', () => {
    it('should send milestone notification for 10 shares', async () => {
      mockPrisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.notifyShareMilestone('user-1', 'petition-1', 10);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: matching({
          type: 'SHARE_MILESTONE',
          title: expect.stringContaining('10') as string,
        }),
      });
    });

    it('should send milestone notification for 50 and 100 shares', async () => {
      mockPrisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      for (const count of [50, 100, 250, 500, 1000]) {
        await service.notifyShareMilestone('user-1', 'petition-1', count);
        expect(mockPrisma.notification.create).toHaveBeenCalled();
      }
    });

    it('should not send notification for non-milestone shares', async () => {
      mockPrisma.petition.findUnique.mockResolvedValue(mockPetition as any);

      await service.notifyShareMilestone('user-1', 'petition-1', 15);

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Leaderboard Achievement Notifications', () => {
    it('should send notification for top 10 leaderboard positions', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      for (const rank of [1, 2, 3, 5, 10]) {
        await service.notifyLeaderboardAchievement(
          'user-1',
          rank,
          'Global Shares',
        );
        expect(mockPrisma.notification.create).toHaveBeenCalled();
      }
    });

    it('should not send notification for rank outside top 10', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.notifyLeaderboardAchievement('user-1', 11, 'Global Shares');

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('should use different medal emojis for top 3 positions', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      const medals = ['🥇', '🥈', '🥉'];

      for (let i = 0; i < 3; i++) {
        await service.notifyLeaderboardAchievement(
          'user-1',
          i + 1,
          'Global Shares',
        );

        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: matching({
            title: expect.stringContaining(medals[i]) as string,
          }),
        });
      }
    });
  });

  describe('Bulk Notification Creation', () => {
    it('should create notifications for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const payload = {
        type: 'ANNOUNCEMENT',
        title: 'New Challenge',
        message: 'A new challenge is available',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.createBulkNotifications(userIds, payload);

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(3);
    });
  });
});
