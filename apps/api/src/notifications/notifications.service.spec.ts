import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadgeUnlockedEvent,
  ChallengeCompletedEvent,
} from '../events/domain-events';

/**
 * Notifications Service Unit Tests
 * Tests notification creation, badge/challenge events, and preferences
 */
describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    creatorId: 'creator-1',
  };

  const mockBadge = {
    id: 'badge-1',
    userId: 'user-1',
    badgeType: 'SHARE_WIZARD',
  };

  const mockChallenge = {
    id: 'challenge-1',
    title: 'Share Challenge',
    goalValue: 10,
    rewardMultiplier: 2.0,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              findUnique: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
              updateMany: jest.fn().mockResolvedValue(null) as any,
              delete: jest.fn().mockResolvedValue(null) as any,
              count: jest.fn().mockResolvedValue(0) as any,
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
            },
            petition: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
            },
            shareChallenge: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
            },
            notificationPreference: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              upsert: jest.fn().mockResolvedValue(null) as any,
            },
            content: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
            },
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<NotificationsService>(NotificationsService);
    prismaService = moduleFixture.get(PrismaService) as any;
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const payload = {
        type: 'BADGE_UNLOCKED',
        title: 'Badge Unlocked',
        message: 'You unlocked a badge',
      };

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        ...payload,
        metadata: null,
        status: 'UNREAD',
        createdAt: new Date(),
      } as any);

      const result = await service.createNotification('user-1', payload);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
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

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        ...payload,
        status: 'UNREAD',
        createdAt: new Date(),
      } as any);

      const result = await service.createNotification('user-1', payload);

      expect(result).toBeDefined();
      expect(result.metadata).toEqual({ badgeType: 'SHARE_WIZARD' });
    });
  });

  describe('Badge Unlock Notifications', () => {
    it('should handle badge unlocked event', async () => {
      const event: BadgeUnlockedEvent = {
        userId: 'user-1',
        badgeType: 'SHARE_WIZARD',
        petitionId: 'petition-1',
      } as any;

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleBadgeUnlocked(event);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'BADGE_UNLOCKED',
          title: expect.stringContaining('Share Wizard'),
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
        const event: BadgeUnlockedEvent = {
          userId: 'user-1',
          badgeType: badgeType,
          petitionId: 'petition-1',
        } as any;

        prismaService.notification.create.mockResolvedValue({
          id: 'notif-1',
        } as any);

        await service.handleBadgeUnlocked(event);

        expect(prismaService.notification.create).toHaveBeenCalled();
      }
    });
  });

  describe('Challenge Completion Notifications', () => {
    it('should handle challenge completed event', async () => {
      const event: ChallengeCompletedEvent = {
        userId: 'user-1',
        challengeId: 'challenge-1',
        petitionId: 'petition-1',
      } as any;

      prismaService.shareChallenge.findUnique.mockResolvedValue(
        mockChallenge as any,
      );
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleChallengeCompleted(event);

      expect(prismaService.shareChallenge.findUnique).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        select: { title: true, rewardMultiplier: true },
      });

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'CHALLENGE_COMPLETED',
          title: expect.stringContaining('Share Challenge'),
        }),
      });
    });

    it('should include reward multiplier in challenge notification', async () => {
      const event: ChallengeCompletedEvent = {
        userId: 'user-1',
        challengeId: 'challenge-1',
        petitionId: 'petition-1',
      } as any;

      prismaService.shareChallenge.findUnique.mockResolvedValue({
        title: 'Advanced Challenge',
        rewardMultiplier: 3.0,
      } as any);
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.handleChallengeCompleted(event);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: expect.stringContaining('3x'),
          metadata: expect.stringContaining('"rewardMultiplier":3'),
        }),
      });
    });

    it('should handle missing challenge gracefully', async () => {
      const event: ChallengeCompletedEvent = {
        userId: 'user-1',
        challengeId: 'challenge-999',
        petitionId: 'petition-1',
      } as any;

      prismaService.shareChallenge.findUnique.mockResolvedValue(null);

      // Should not throw, just log warning
      await service.handleChallengeCompleted(event);

      expect(prismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Mark Notification As Read', () => {
    it('should mark notification as read', async () => {
      prismaService.notification.update.mockResolvedValue({
        id: 'notif-1',
        status: 'READ',
        readAt: new Date(),
      } as any);

      await service.markAsRead('notif-1');

      expect(prismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('Mark All Notifications As Read', () => {
    it('should mark all unread notifications as read', async () => {
      prismaService.notification.updateMany.mockResolvedValue({
        count: 5,
      } as any);

      await service.markAllAsRead('user-1');

      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        data: {
          status: 'READ',
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      prismaService.notification.delete.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.deleteNotification('notif-1');

      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });
  });

  describe('Get Unread Notifications', () => {
    it('should get unread notifications with limit', async () => {
      const mockNotifications = [
        { id: 'notif-1', type: 'BADGE_UNLOCKED', status: 'UNREAD' },
        { id: 'notif-2', type: 'CHALLENGE_COMPLETED', status: 'UNREAD' },
      ];

      prismaService.notification.findMany.mockResolvedValue(
        mockNotifications as any,
      );

      const result = await service.getUnreadNotifications('user-1', 20);

      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('should default to limit of 10', async () => {
      prismaService.notification.findMany.mockResolvedValue([]);

      await service.getUnreadNotifications('user-1');

      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'UNREAD' },
        orderBy: { createdAt: 'desc' },
        take: 10,
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

      prismaService.notificationPreference.findUnique.mockResolvedValue(
        mockPrefs as any,
      );

      const result = await service.getPreferences('user-1');

      expect(prismaService.notificationPreference.findUnique).toHaveBeenCalledWith(
        { where: { userId: 'user-1' } },
      );
      expect(result).toEqual(mockPrefs);
    });

    it('should update user notification preferences', async () => {
      const updatedPrefs = {
        userId: 'user-1',
        badges: false,
        challenges: true,
        email: false,
        sms: true,
      };

      prismaService.notificationPreference.upsert.mockResolvedValue(
        updatedPrefs as any,
      );

      const result = await service.updatePreferences('user-1', {
        badges: false,
        email: false,
        sms: true,
      });

      expect(prismaService.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: expect.objectContaining({ userId: 'user-1' }),
        update: {
          badges: false,
          email: false,
          sms: true,
        },
      });

      expect(result).toEqual(updatedPrefs);
    });
  });

  describe('Share Milestone Notifications', () => {
    it('should send milestone notification for 10 shares', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.notifyShareMilestone('user-1', 'petition-1', 10);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'SHARE_MILESTONE',
          title: expect.stringContaining('10'),
        }),
      });
    });

    it('should send milestone notification for 50 and 100 shares', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      for (const count of [50, 100, 250, 500, 1000]) {
        await service.notifyShareMilestone('user-1', 'petition-1', count);
        expect(prismaService.notification.create).toHaveBeenCalled();
      }
    });

    it('should not send notification for non-milestone shares', async () => {
      prismaService.petition.findUnique.mockResolvedValue(
        mockPetition as any,
      );

      await service.notifyShareMilestone('user-1', 'petition-1', 15);

      expect(prismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Leaderboard Achievement Notifications', () => {
    it('should send notification for top 10 leaderboard positions', async () => {
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      for (const rank of [1, 2, 3, 5, 10]) {
        await service.notifyLeaderboardAchievement(
          'user-1',
          rank,
          'Global Shares',
        );
        expect(prismaService.notification.create).toHaveBeenCalled();
      }
    });

    it('should not send notification for rank outside top 10', async () => {
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.notifyLeaderboardAchievement('user-1', 11, 'Global Shares');

      expect(prismaService.notification.create).not.toHaveBeenCalled();
    });

    it('should use different medal emojis for top 3 positions', async () => {
      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      const medals = ['🥇', '🥈', '🥉'];

      for (let i = 0; i < 3; i++) {
        await service.notifyLeaderboardAchievement(
          'user-1',
          i + 1,
          'Global Shares',
        );

        expect(prismaService.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: expect.stringContaining(medals[i]),
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

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
      } as any);

      await service.createBulkNotifications(userIds, payload);

      expect(prismaService.notification.create).toHaveBeenCalledTimes(3);
    });
  });
});
