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
      // Payment, Subscription, Donation, Refund, OrderItem x2,
      // MoMoSubscriptionAuthorization = 7 queries.
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(7);
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

  describe('findMissingDualWrites', () => {
    it('returns no reports when every $queryRaw call finds zero rows with a NULL Decimal column', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const reports = await scheduler.findMissingDualWrites();

      expect(reports).toEqual([]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(7);
    });

    it('REGRESSION: reports a row whose Decimal column is still NULL (e.g. the admin refund dual-write gap)', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // Payment
        .mockResolvedValueOnce([]) // Subscription
        .mockResolvedValueOnce([]) // Donation
        .mockResolvedValueOnce([{ id: 'refund-1' }, { id: 'refund-2' }]) // Refund
        .mockResolvedValue([]);

      const reports = await scheduler.findMissingDualWrites();

      expect(reports).toEqual([
        {
          table: 'Refund',
          column: 'amountDecimal',
          count: 2,
          sampleIds: ['refund-1', 'refund-2'],
        },
      ]);
    });
  });

  describe('checkConsistency', () => {
    it('logs nothing via ActivityLoggerService when there is no drift and no missing dual-write', async () => {
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

    it('REGRESSION: logs a DECIMAL_DUAL_WRITE_MISSING entry when a Decimal column is NULL, independently of drift', async () => {
      // findDrift's 7 calls all clean, then findMissingDualWrites' 4th call
      // (Refund) finds a miss.
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // findDrift: Payment
        .mockResolvedValueOnce([]) // findDrift: Subscription
        .mockResolvedValueOnce([]) // findDrift: Donation
        .mockResolvedValueOnce([]) // findDrift: Refund
        .mockResolvedValueOnce([]) // findDrift: OrderItem.unitPrice
        .mockResolvedValueOnce([]) // findDrift: OrderItem.totalPrice
        .mockResolvedValueOnce([]) // findDrift: MoMoSubscriptionAuthorization
        .mockResolvedValueOnce([]) // findMissingDualWrites: Payment
        .mockResolvedValueOnce([]) // findMissingDualWrites: Subscription
        .mockResolvedValueOnce([]) // findMissingDualWrites: Donation
        .mockResolvedValueOnce([{ id: 'refund-1' }]) // findMissingDualWrites: Refund
        .mockResolvedValue([]);

      await scheduler.checkConsistency();

      expect(mockActivityLogger.logAsync).toHaveBeenCalledTimes(1);
      expect(mockActivityLogger.logAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DECIMAL_DUAL_WRITE_MISSING',
          entityType: 'REFUND',
          status: 'FAILED',
          changes: expect.objectContaining({
            table: 'Refund',
            column: 'amountDecimal',
            count: 1,
            sampleRowIds: ['refund-1'],
          }) as unknown,
        }),
      );
    });
  });
});
