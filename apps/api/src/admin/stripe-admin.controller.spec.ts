import { Prisma } from '@prisma/client';
import { StripeAdminController } from './stripe-admin.controller';

describe('StripeAdminController', () => {
  const mockPrisma = {
    payment: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    subscription: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    refund: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockPaymentService = {};
  const mockActivityLogger = { logAsync: jest.fn() };
  const req = { user: { userId: 'admin-1' } };

  let controller: StripeAdminController;

  beforeEach(() => {
    jest.clearAllMocks();
    // No STRIPE_API_KEY set — the controller's Stripe client stays null, so
    // every code path under test here takes the "Stripe unavailable" branch
    // and falls straight through to the Prisma write/read being exercised.
    delete process.env.STRIPE_API_KEY;
    controller = new StripeAdminController(
      mockPrisma as never,
      mockPaymentService as never,
      mockActivityLogger as never,
    );
  });

  describe('createRefund', () => {
    it('REGRESSION (Milestone 12): dual-writes amountDecimal, closing the gap the consistency job could not see', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'COMPLETED',
        amount: 50,
        amountDecimal: null,
        currency: 'USD',
        stripePaymentIntentId: null,
      });
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1' });

      await controller.createRefund(req as never, {
        paymentId: 'payment-1',
        reason: 'requested_by_customer',
      });

      expect(mockPrisma.refund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 50,
          amountDecimal: new Prisma.Decimal(50),
        }) as unknown,
      });
    });

    it('sources the refund amount from the Decimal column when the caller does not specify one', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'COMPLETED',
        // Stale Float, correct Decimal — the refund must use the Decimal.
        amount: 999,
        amountDecimal: { toNumber: () => 50 },
        currency: 'USD',
        stripePaymentIntentId: null,
      });
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1' });

      await controller.createRefund(req as never, {
        paymentId: 'payment-1',
        reason: 'requested_by_customer',
      });

      expect(mockPrisma.refund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 50,
          amountDecimal: new Prisma.Decimal(50),
        }) as unknown,
      });
    });

    it('an explicit partial-refund amount overrides the payment amount entirely', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'COMPLETED',
        amount: 100,
        amountDecimal: { toNumber: () => 100 },
        currency: 'USD',
        stripePaymentIntentId: null,
      });
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1' });

      await controller.createRefund(req as never, {
        paymentId: 'payment-1',
        reason: 'requested_by_customer',
        amount: 25,
      });

      expect(mockPrisma.refund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 25,
          amountDecimal: new Prisma.Decimal(25),
        }) as unknown,
      });
    });
  });

  describe('cancelSubscription', () => {
    it("REGRESSION: writes the real SubscriptionStatus enum value 'CANCELLED', not the invalid 'CANCELED'", async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        stripeSubscriptionId: null,
      });
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub-1',
        status: 'CANCELLED',
        user: { id: 'user-1', email: 'a@b.com' },
      });

      await controller.cancelSubscription(req as never, 'sub-1');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }) as unknown,
        }),
      );
    });
  });

  describe('getDashboard', () => {
    it('REGRESSION (Milestone 12): sums revenue from the Decimal column, not the stale Float', async () => {
      mockPrisma.payment.findMany
        .mockResolvedValueOnce([
          { amount: 999, amountDecimal: { toNumber: () => 50 } },
          { amount: 999, amountDecimal: { toNumber: () => 30 } },
        ])
        .mockResolvedValueOnce([]);
      mockPrisma.subscription.findMany.mockResolvedValue([]);
      mockPrisma.refund.findMany.mockResolvedValue([
        { amount: 999, amountDecimal: { toNumber: () => 10 } },
      ]);

      const result = await controller.getDashboard();

      expect(result.totalRevenue).toBe(80);
      expect(result.refundAmount).toBe(10);
    });
  });

  describe('getCustomerHistory', () => {
    it('sums totalSpent from the Decimal column', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        fullName: 'A B',
        email: 'a@b.com',
      });
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          status: 'COMPLETED',
          amount: 999,
          amountDecimal: { toNumber: () => 40 },
        },
        {
          status: 'PENDING',
          amount: 999,
          amountDecimal: { toNumber: () => 999 },
        },
      ]);
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await controller.getCustomerHistory('user-1');

      expect(result.totalSpent).toBe(40);
    });
  });
});
