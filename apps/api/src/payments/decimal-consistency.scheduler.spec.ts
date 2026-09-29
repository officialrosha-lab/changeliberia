import { DecimalConsistencyScheduler } from './decimal-consistency.scheduler';

describe('DecimalConsistencyScheduler', () => {
  const mockPrisma = {
    $queryRaw: jest.fn<Promise<unknown[]>, [unknown]>(),
  };
  const mockActivityLogger = { logAsync: jest.fn() };

  let scheduler: DecimalConsistencyScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new DecimalConsistencyScheduler(
      mockPrisma as never,
      mockActivityLogger as never,
    );
  });

  describe('findDrift', () => {
    it('returns no reports when every $queryRaw call finds zero drifted rows', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const reports = await scheduler.findDrift();

      expect(reports).toEqual([]);
      // Payment, Subscription, Donation, Refund, OrderItem x2 = 6 queries.
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(6);
    });

    it('reports a drifted column when the raw query returns rows', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          {
            id: 'pay-1',
            floatValue: 50,
            decimalValue: { toString: () => '75' },
          },
        ])
        .mockResolvedValue([]);

      const reports = await scheduler.findDrift();

      expect(reports).toEqual([
        {
          table: 'Payment',
          column: 'amountDecimal',
          rows: [{ id: 'pay-1', floatValue: 50, decimalValue: '75' }],
        },
      ]);
    });
  });

  describe('checkConsistency', () => {
    it('logs nothing via ActivityLoggerService when there is no drift', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await scheduler.checkConsistency();

      expect(mockActivityLogger.logAsync).not.toHaveBeenCalled();
    });

    it('logs one DECIMAL_DRIFT_DETECTED entry per drifted column', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          {
            id: 'pay-1',
            floatValue: 50,
            decimalValue: { toString: () => '75' },
          },
        ])
        .mockResolvedValue([]);

      await scheduler.checkConsistency();

      expect(mockActivityLogger.logAsync).toHaveBeenCalledTimes(1);
      expect(mockActivityLogger.logAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DECIMAL_DRIFT_DETECTED',
          entityType: 'PAYMENT',
          status: 'FAILED',
          changes: expect.objectContaining({
            table: 'Payment',
            column: 'amountDecimal',
            count: 1,
          }) as unknown,
        }),
      );
    });
  });
});
