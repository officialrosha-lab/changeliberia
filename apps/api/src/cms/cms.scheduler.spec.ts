import { Test, TestingModule } from '@nestjs/testing';
import { CMSScheduler } from './cms.scheduler';
import { ContentSchedulingService } from './content-scheduling.service';

describe('CMSScheduler', () => {
  let module: TestingModule;
  let scheduler: CMSScheduler;
  let contentSchedulingService: ContentSchedulingService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CMSScheduler,
        {
          provide: ContentSchedulingService,
          useValue: {
            executeScheduledActions: jest.fn().mockResolvedValue({
              executed: 1,
              failed: 0,
            }),
          },
        },
      ],
    }).compile();

    scheduler = module.get<CMSScheduler>(CMSScheduler);
    contentSchedulingService = module.get<ContentSchedulingService>(ContentSchedulingService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('executeScheduledActions', () => {
    it('should call contentSchedulingService.executeScheduledActions', async () => {
      const result = await scheduler.executeScheduledActions();

      expect(contentSchedulingService.executeScheduledActions).toHaveBeenCalled();
      expect(result).toEqual({ executed: 1, failed: 0 });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (contentSchedulingService.executeScheduledActions as jest.Mock).mockRejectedValueOnce(error);

      await expect(scheduler.executeScheduledActions()).rejects.toThrow('Database connection failed');
    });

    it('should return execution results', async () => {
      (contentSchedulingService.executeScheduledActions as jest.Mock).mockResolvedValueOnce({
        executed: 5,
        failed: 1,
        actions: [
          { id: 'schedule-1', action: 'publish', status: 'completed' },
          { id: 'schedule-2', action: 'publish', status: 'completed' },
        ],
      });

      const result = await scheduler.executeScheduledActions();

      expect(result.executed).toBe(5);
      expect(result.failed).toBe(1);
      expect(result.actions).toHaveLength(2);
    });
  });
});
