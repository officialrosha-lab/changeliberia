import { Test, TestingModule } from '@nestjs/testing';
import { ContentSchedulingService } from './content-scheduling.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContentSchedulingService', () => {
  let module: TestingModule;
  let service: ContentSchedulingService;
  let prisma: PrismaService;

  const mockPrisma = {
    cMSSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cMSPage: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ContentSchedulingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ContentSchedulingService>(ContentSchedulingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('scheduleAction', () => {
    it('should create a schedule for publishing content', async () => {
      const data = {
        pageId: 'page-1',
        action: 'publish' as const,
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
        createdBy: 'user-1',
      };

      mockPrisma.cMSSchedule.create.mockResolvedValueOnce({
        id: 'schedule-1',
        pageId: data.pageId,
        action: data.action,
        scheduledFor: data.scheduledFor,
        executed: false,
        createdAt: new Date(),
        createdBy: data.createdBy,
      });

      const result = await service.scheduleAction(data.pageId, data.action, data.scheduledFor, data.createdBy);

      expect(prisma.cMSSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pageId: data.pageId,
            action: data.action,
            scheduledFor: data.scheduledFor,
          }),
        })
      );

      expect(result.action).toBe('publish');
      expect(result.executed).toBe(false);
    });

    it('should schedule unpublish action', async () => {
      const data = {
        pageId: 'page-1',
        action: 'unpublish' as const,
        scheduledFor: new Date(Date.now() + 7200000), // 2 hours from now
        createdBy: 'user-1',
      };

      mockPrisma.cMSSchedule.create.mockResolvedValueOnce({
        id: 'schedule-2',
        pageId: data.pageId,
        action: data.action,
        scheduledFor: data.scheduledFor,
        executed: false,
        createdAt: new Date(),
        createdBy: data.createdBy,
      });

      const result = await service.scheduleAction(data.pageId, data.action, data.scheduledFor, data.createdBy);

      expect(result.action).toBe('unpublish');
    });
  });

  describe('executeScheduledActions', () => {
    it('should execute pending scheduled publish actions', async () => {
      const now = new Date();

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([
        {
          id: 'schedule-1',
          pageId: 'page-1',
          action: 'publish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
      ]);

      mockPrisma.cMSPage.update.mockResolvedValueOnce({
        id: 'page-1',
        published: true,
      });

      mockPrisma.cMSSchedule.update.mockResolvedValueOnce({
        id: 'schedule-1',
        executed: true,
      });

      await service.executeScheduledActions();

      expect(prisma.cMSSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            executed: false,
          }),
        })
      );

      expect(prisma.cMSPage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'page-1' },
          data: expect.objectContaining({ published: true }),
        })
      );

      expect(prisma.cMSSchedule.update).toHaveBeenCalled();
    });

    it('should execute pending unpublish actions', async () => {
      const now = new Date();

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([
        {
          id: 'schedule-2',
          pageId: 'page-2',
          action: 'unpublish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
      ]);

      mockPrisma.cMSPage.update.mockResolvedValueOnce({
        id: 'page-2',
        published: false,
      });

      mockPrisma.cMSSchedule.update.mockResolvedValueOnce({
        id: 'schedule-2',
        executed: true,
      });

      await service.executeScheduledActions();

      expect(prisma.cMSPage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'page-2' },
          data: expect.objectContaining({ published: false }),
        })
      );
    });

    it('should handle multiple scheduled actions', async () => {
      const now = new Date();

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([
        {
          id: 'schedule-1',
          pageId: 'page-1',
          action: 'publish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
        {
          id: 'schedule-2',
          pageId: 'page-2',
          action: 'unpublish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
        {
          id: 'schedule-3',
          pageId: 'page-3',
          action: 'publish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
      ]);

      mockPrisma.cMSPage.update.mockResolvedValue({});
      mockPrisma.cMSSchedule.update.mockResolvedValue({});

      await service.executeScheduledActions();

      expect(prisma.cMSPage.update).toHaveBeenCalledTimes(3);
      expect(prisma.cMSSchedule.update).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully', async () => {
      const now = new Date();

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([
        {
          id: 'schedule-1',
          pageId: 'page-1',
          action: 'publish',
          scheduledFor: now,
          executed: false,
          createdAt: new Date(),
        },
      ]);

      mockPrisma.cMSPage.update.mockRejectedValueOnce(new Error('Page not found'));

      // Should not throw - errors are caught and logged
      await expect(service.executeScheduledActions()).resolves.not.toThrow();
    });

    it('should not execute future scheduled actions', async () => {
      const future = new Date(Date.now() + 3600000); // 1 hour from now

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([]);

      await service.executeScheduledActions();

      expect(prisma.cMSPage.update).not.toHaveBeenCalled();
    });
  });

  describe('getPageSchedules', () => {
    it('should return all schedules for a page', async () => {
      const pageId = 'page-1';

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([
        {
          id: 'schedule-1',
          pageId,
          action: 'publish',
          scheduledFor: new Date(),
          executed: false,
          createdAt: new Date(),
        },
        {
          id: 'schedule-2',
          pageId,
          action: 'unpublish',
          scheduledFor: new Date(),
          executed: false,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getPageSchedules(pageId);

      expect(prisma.cMSSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pageId },
        })
      );

      expect(result).toHaveLength(2);
    });

    it('should return empty array for page with no schedules', async () => {
      const pageId = 'page-empty';

      mockPrisma.cMSSchedule.findMany.mockResolvedValueOnce([]);

      const result = await service.getPageSchedules(pageId);

      expect(result).toHaveLength(0);
    });
  });

  describe('cancelSchedule', () => {
    it('should delete a scheduled action', async () => {
      const scheduleId = 'schedule-1';

      mockPrisma.cMSSchedule.delete.mockResolvedValueOnce({
        id: scheduleId,
        executed: false,
      });

      const result = await service.cancelSchedule(scheduleId);

      expect(prisma.cMSSchedule.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: scheduleId },
        })
      );

      expect(result.id).toBe(scheduleId);
    });
  });
});
