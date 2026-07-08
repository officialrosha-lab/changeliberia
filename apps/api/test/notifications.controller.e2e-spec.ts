/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { NotificationController } from '../src/notifications/notification.controller';
import { NotificationService } from '../src/notifications/notification.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

/**
 * Notification Controller Integration Tests
 * Tests the REST endpoints the web frontend actually calls
 * (notification-dropdown.tsx / app/notifications/page.tsx):
 *   GET    /notifications
 *   GET    /notifications/unread-count
 *   PATCH  /notifications/:id/read
 *   POST   /notifications/mark-all-read
 *   PATCH  /notifications/:id/archive
 *   DELETE /notifications/:id
 *   GET    /notifications/preferences
 *   POST   /notifications/preferences
 */
describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let notificationService: jest.Mocked<NotificationService>;

  const mockUser = {
    id: 'user-1',
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
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'CHALLENGE_COMPLETED',
      title: '🎯 Challenge Complete: Share Challenge',
      message: 'You completed the Share Challenge',
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
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
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            getUserNotifications: jest.fn(),
            getUnreadCount: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            archive: jest.fn(),
            delete: jest.fn(),
            getPreferences: jest.fn(),
            updatePreferences: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirror production: global prefix comes from main.ts; the controller
    // path is 'notifications', so routes live at /api/v1/notifications/*.
    app.setGlobalPrefix('api/v1');
    await app.init();

    notificationService = moduleFixture.get(
      NotificationService,
    ) as jest.Mocked<NotificationService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/notifications - List notifications', () => {
    it('should return notifications with total (shape the frontend destructures)', () => {
      notificationService.getUserNotifications.mockResolvedValue({
        notifications: mockNotifications as any,
        total: 2,
      });

      return request(app.getHttpServer())
        .get('/api/v1/notifications?limit=10&unreadOnly=false')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.notifications)).toBe(true);
          expect(res.body.total).toBe(2);
        });
    });

    it('should pass pagination filters through to the service', async () => {
      notificationService.getUserNotifications.mockResolvedValue({
        notifications: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/api/v1/notifications?limit=20&offset=40&status=UNREAD')
        .expect(200);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ limit: 20, offset: 40, status: 'UNREAD' }),
      );
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return { unreadCount }', () => {
      notificationService.getUnreadCount.mockResolvedValue(5);

      return request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .expect(200)
        .expect((res) => {
          expect(res.body.unreadCount).toBe(5);
        });
    });
  });

  describe('PATCH /api/v1/notifications/:id/read - Mark as read', () => {
    it('should mark notification as read', () => {
      notificationService.markAsRead.mockResolvedValue({
        ...mockNotifications[0],
        status: 'READ',
      } as any);

      return request(app.getHttpServer())
        .patch('/api/v1/notifications/notif-1/read')
        .expect(200);
    });

    it('should handle notification not found', () => {
      notificationService.markAsRead.mockRejectedValue(
        new NotFoundException('Notification not found'),
      );

      return request(app.getHttpServer())
        .patch('/api/v1/notifications/invalid-id/read')
        .expect(404);
    });
  });

  describe('POST /api/v1/notifications/mark-all-read', () => {
    it('should mark all notifications as read', () => {
      notificationService.markAllAsRead.mockResolvedValue({ count: 3 } as any);

      return request(app.getHttpServer())
        .post('/api/v1/notifications/mark-all-read')
        .expect(201)
        .expect((res) => {
          expect(res.body.count).toBe(3);
        });
    });
  });

  describe('PATCH /api/v1/notifications/:id/archive', () => {
    it('should archive notification', () => {
      notificationService.archive.mockResolvedValue({
        ...mockNotifications[0],
        status: 'ARCHIVED',
      } as any);

      return request(app.getHttpServer())
        .patch('/api/v1/notifications/notif-1/archive')
        .expect(200);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', () => {
      notificationService.delete.mockResolvedValue(undefined as any);

      return request(app.getHttpServer())
        .delete('/api/v1/notifications/notif-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle notification not found', () => {
      notificationService.delete.mockRejectedValue(
        new NotFoundException('Notification not found'),
      );

      return request(app.getHttpServer())
        .delete('/api/v1/notifications/invalid-id')
        .expect(404);
    });
  });

  describe('GET /api/v1/notifications/preferences', () => {
    it('should return notification preferences', () => {
      const mockPrefs = {
        userId: 'user-1',
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: false,
      };

      notificationService.getPreferences.mockResolvedValue(mockPrefs as any);

      return request(app.getHttpServer())
        .get('/api/v1/notifications/preferences')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/notifications/preferences - Update preferences', () => {
    it('should update notification preferences', () => {
      const updatedPrefs = {
        userId: 'user-1',
        inAppEnabled: false,
        emailEnabled: false,
        pushEnabled: true,
      };

      notificationService.updatePreferences.mockResolvedValue(
        updatedPrefs as any,
      );

      return request(app.getHttpServer())
        .post('/api/v1/notifications/preferences')
        .send({ inAppEnabled: false, emailEnabled: false, pushEnabled: true })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject(updatedPrefs);
        });
    });
  });
});
