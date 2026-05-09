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
            executeScheduledActions: jest.fn().mockResolvedValue(undefined),
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
      await scheduler.executeScheduledActions();

      expect(contentSchedulingService.executeScheduledActions).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (contentSchedulingService.executeScheduledActions as jest.Mock).mockRejectedValueOnce(error);

      // The scheduler catches errors and logs them, doesn't throw
      await expect(scheduler.executeScheduledActions()).resolves.toBeUndefined();
      expect(contentSchedulingService.executeScheduledActions).toHaveBeenCalled();
    });

    it('should execute successfully and call service method', async () => {
      (contentSchedulingService.executeScheduledActions as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await scheduler.executeScheduledActions();

      expect(result).toBeUndefined();
      expect(contentSchedulingService.executeScheduledActions).toHaveBeenCalled();
    });
  });
});
