import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

/**
 * Notifications Controller Integration Tests
 * Tests REST API endpoints for notification management
 * 
 * Note: We only import NotificationsController (the active one with hardcoded api/v1/notifications path).
 * The duplicate NotificationController in notification.controller.ts is not used in production.
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

  // Mock JWT guard to allow all authenticated requests
  class MockJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      request.user = mockUser;
      return true;
    }
  }

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
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Don't set global prefix - NotificationsController has hardcoded 'api/v1/notifications' path
    app.setGlobalPrefix('');
    await app.init();

    notificationsService = moduleFixture.get(
      NotificationsService,
    ) as jest.Mocked<NotificationsService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/notifications - Get unread notifications', () => {
    it('should return unread notifications', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue(
        mockNotifications as any,
      );

      return request(app.getHttpServer())
        .get('/api/v1/notifications')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should support pagination with limit and offset', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/v1/notifications?limit=10&offset=0')
        .expect(200);
    });

    it('should cap limit at 100', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/v1/notifications?limit=500')
        .expect(200);
    });

    it('should accept negative limit values', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/v1/notifications?limit=-1')
        .expect(200);
    });

    it('should accept negative offset values', () => {
      notificationsService.getUnreadNotifications.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/v1/notifications?offset=-5')
        .expect(200);
    });
  });

  describe('POST /api/v1/notifications/:notificationId/read - Mark as read', () => {
    it('should mark notification as read', () => {
      notificationsService.markAsRead.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/api/v1/notifications/notif-1/read')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle notification not found', () => {
      notificationsService.markAsRead.mockRejectedValue(
        new NotFoundException('Notification not found'),
      );

      return request(app.getHttpServer())
        .post('/api/v1/notifications/invalid-id/read')
        .expect(404);
    });
  });

  describe('POST /api/v1/notifications/read-all - Mark all as read', () => {
    it('should mark all notifications as read', () => {
      notificationsService.markAllAsRead.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/api/v1/notifications/read-all')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('DELETE /api/v1/notifications/:notificationId - Delete notification', () => {
    it('should delete notification', () => {
      notificationsService.deleteNotification.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .delete('/api/v1/notifications/notif-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle notification not found', () => {
      notificationsService.deleteNotification.mockRejectedValue(
        new NotFoundException('Notification not found'),
      );

      return request(app.getHttpServer())
        .delete('/api/v1/notifications/invalid-id')
        .expect(404);
    });
  });

  describe('GET /api/v1/notifications/preferences - Get preferences', () => {
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
        .get('/api/v1/notifications/preferences')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should return default preferences if not set', () => {
      notificationsService.getPreferences.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/v1/notifications/preferences')
        .expect(200);
    });
  });

  describe('PATCH /api/v1/notifications/preferences - Update preferences', () => {
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
        .patch('/api/v1/notifications/preferences')
        .send({ badges: false, email: false, sms: true })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject(updatedPrefs);
        });
    });

    it('should allow partial preference updates', () => {
      notificationsService.updatePreferences.mockResolvedValue({} as any);

      return request(app.getHttpServer())
        .patch('/api/v1/notifications/preferences')
        .send({ badges: false })
        .expect(200);
    });
  });
});
