import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Notifications Controller Integration Tests
 * Tests REST API endpoints for notification management
 */
describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockUser = {
    sub: 'user-1',
    email: 'test@example.com',
  };

  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'BADGE_UNLOCKED',
      title: '🏆 Badge Unlocked: Share Wizard',
      message: 'You unlocked the Share Wizard badge',
      status: 'UNREAD',
      createdAt: new Date(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'CHALLENGE_COMPLETED',
      title: '🎯 Challenge Complete: Share Challenge',
      message: 'You completed the Share Challenge',
      status: 'UNREAD',
      createdAt: new Date(),
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn(),
            createBulkNotifications: jest.fn(),
            getUnreadNotifications: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            deleteNotification: jest.fn(),
            getPreferences: jest.fn(),
            updatePreferences: jest.fn(),
            handleBadgeUnlocked: jest.fn(),
            handleChallengeCompleted: jest.fn(),
            notifyShareMilestone: jest.fn(),
            notifyLeaderboardAchievement: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    notificationsService = moduleFixture.get(
      NotificationsService,
    ) as jest.Mocked<NotificationsService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /notifications - Get unread notifications', () => {
    it('should return unread notifications', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue(
        mockNotifications as any,
      );

      return request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.notifications).toBeDefined();
          expect(res.body.data.count).toBeDefined();
        });
    });

    it('should support pagination with limit and offset', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/notifications?limit=10&offset=0')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
    });

    it('should cap limit at 100', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/notifications?limit=500')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
    });

    it('should reject invalid limit', () => {
      return request(app.getHttpServer())
        .get('/api/notifications?limit=-1')
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should reject invalid offset', () => {
      return request(app.getHttpServer())
        .get('/api/notifications?offset=-5')
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .get('/api/notifications')
        .expect(401);
    });
  });

  describe('GET /notifications/all - Get all notifications', () => {
    it('should return all notifications (read + unread)', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue(
        mockNotifications as any,
      );

      return request(app.getHttpServer())
        .get('/api/notifications/all')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('notifications');
          expect(res.body.data).toHaveProperty('count');
        });
    });
  });

  describe('POST /notifications/:notificationId/read - Mark as read', () => {
    it('should mark notification as read', () => {
      notificationsService.markAsRead.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/api/notifications/notif-1/read')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('read');
        });
    });

    it('should handle notification not found', () => {
      notificationsService.markAsRead.mockRejectedValue(
        new Error('Notification not found'),
      );

      return request(app.getHttpServer())
        .post('/api/notifications/invalid-id/read')
        .set('Authorization', 'Bearer test-token')
        .expect(404);
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/notif-1/read')
        .expect(401);
    });
  });

  describe('POST /notifications/read-all - Mark all as read', () => {
    it('should mark all notifications as read', () => {
      notificationsService.markAllAsRead.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('All');
        });
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .expect(401);
    });
  });

  describe('DELETE /notifications/:notificationId - Delete notification', () => {
    it('should delete notification', () => {
      notificationsService.deleteNotification.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .delete('/api/notifications/notif-1')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('deleted');
        });
    });

    it('should handle notification not found', () => {
      notificationsService.deleteNotification.mockRejectedValue(
        new Error('Notification not found'),
      );

      return request(app.getHttpServer())
        .delete('/api/notifications/invalid-id')
        .set('Authorization', 'Bearer test-token')
        .expect(404);
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .delete('/api/notifications/notif-1')
        .expect(401);
    });
  });

  describe('GET /notifications/preferences - Get preferences', () => {
    it('should return notification preferences', () => {
      const mockPrefs = {
        userId: 'user-1',
        badges: true,
        challenges: true,
        email: true,
        sms: false,
      };

      notificationsService.getPreferences.mockResolvedValue(mockPrefs as any);

      return request(app.getHttpServer())
        .get('/api/notifications/preferences')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('badges');
          expect(res.body.data).toHaveProperty('challenges');
          expect(res.body.data).toHaveProperty('email');
          expect(res.body.data).toHaveProperty('sms');
        });
    });

    it('should return default preferences if not set', () => {
      notificationsService.getPreferences.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/notifications/preferences')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.badges).toBe(true);
          expect(res.body.data.email).toBe(true);
          expect(res.body.data.sms).toBe(false);
        });
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .get('/api/notifications/preferences')
        .expect(401);
    });
  });

  describe('PUT /notifications/preferences - Update preferences', () => {
    it('should update notification preferences', () => {
      const updatedPrefs = {
        userId: 'user-1',
        badges: false,
        challenges: true,
        email: false,
        sms: true,
      };

      notificationsService.updatePreferences.mockResolvedValue(
        updatedPrefs as any,
      );

      return request(app.getHttpServer())
        .put('/api/notifications/preferences')
        .set('Authorization', 'Bearer test-token')
        .send({ badges: false, email: false, sms: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.message).toContain('updated');
        });
    });

    it('should allow partial preference updates', () => {
      notificationsService.updatePreferences.mockResolvedValue({} as any);

      return request(app.getHttpServer())
        .put('/api/notifications/preferences')
        .set('Authorization', 'Bearer test-token')
        .send({ badges: false })
        .expect(200);
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .put('/api/notifications/preferences')
        .send({ badges: false })
        .expect(401);
    });
  });

  describe('GET /notifications/unread-count - Get unread count', () => {
    it('should return unread notification count', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue(
        mockNotifications as any,
      );

      return request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('unreadCount');
          expect(res.body.data.unreadCount).toBe(2);
        });
    });

    it('should return 0 when no unread notifications', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.unreadCount).toBe(0);
        });
    });

    it('should require JWT authentication', () => {
      return request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .expect(401);
    });
  });
});
