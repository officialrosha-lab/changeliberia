import { InvoiceStatus, Prisma } from '@prisma/client';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const mockPrisma = {
    invoice: {
      count: jest.fn<Promise<number>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
  const mockActivityLogger = { logAsync: jest.fn() };
  const mockStripeProvider = { createCheckoutSession: jest.fn() };
  const mockMomoProvider = { createCheckoutSession: jest.fn() };

  let service: InvoicesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvoicesService(
      mockPrisma as never,
      mockActivityLogger as never,
      mockStripeProvider as never,
      mockMomoProvider as never,
    );
  });

  describe('createDraft', () => {
    it('rejects an invoice with no line items', async () => {
      await expect(
        service.createDraft({ userId: 'user-1', lineItems: [] }),
      ).rejects.toThrow('at least one line item');
    });

    it('REGRESSION: computes totalAmount as the sum of quantity × unitAmount across all line items', async () => {
      mockPrisma.invoice.count.mockResolvedValue(4); // -> INV-000005
      mockPrisma.invoice.create.mockImplementation((args: unknown) => {
        const { data } = args as { data: unknown };
        return Promise.resolve(data);
      });

      const result = (await service.createDraft({
        userId: 'user-1',
        lineItems: [
          { description: 'Design', unitAmount: 500, quantity: 2 },
          { description: 'Consulting', unitAmount: 150 }, // quantity defaults to 1
        ],
      })) as { number: string; totalAmount: Prisma.Decimal };

      expect(result.number).toBe('INV-000005');
      expect(result.totalAmount.toString()).toBe('1150'); // (500*2) + (150*1)
    });
  });

  describe('issue', () => {
    it('throws NotFoundException for an unknown invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.issue('ghost')).rejects.toThrow('not found');
    });

    it('rejects issuing a non-draft invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.ISSUED,
      });
      await expect(service.issue('inv-1')).rejects.toThrow(
        'Only a draft invoice',
      );
    });
  });

  describe('markPaid', () => {
    it('rejects marking a non-issued invoice paid', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.DRAFT,
      });
      await expect(service.markPaid('inv-1', 'admin-1')).rejects.toThrow(
        'Only an issued invoice',
      );
    });
  });

  describe('pay', () => {
    const payDto = {
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    };

    it('throws NotFoundException for an unknown invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.pay('ghost', 'user-1', payDto)).rejects.toThrow(
        'not found',
      );
    });

    it("REGRESSION: refuses to pay an invoice that isn't the caller's own", async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        userId: 'someone-else',
        status: InvoiceStatus.ISSUED,
      });
      await expect(service.pay('inv-1', 'user-1', payDto)).rejects.toThrow(
        'does not belong to you',
      );
    });

    it('rejects paying a non-issued invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        userId: 'user-1',
        status: InvoiceStatus.DRAFT,
      });
      await expect(service.pay('inv-1', 'user-1', payDto)).rejects.toThrow(
        'Only an issued invoice can be paid',
      );
    });

    it('creates a Stripe checkout session for the invoice total and returns its URL', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        number: 'INV-000001',
        userId: 'user-1',
        status: InvoiceStatus.ISSUED,
        totalAmount: new Prisma.Decimal(1200),
        currency: 'USD',
        provider: 'STRIPE',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'buyer@example.com',
      });
      mockStripeProvider.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/session-1',
      });

      const result = await service.pay('inv-1', 'user-1', payDto);

      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/session-1',
      });
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1200,
          currency: 'USD',
          customerEmail: 'buyer@example.com',
          metadata: { invoiceId: 'inv-1', userId: 'user-1' },
        }),
      );
    });
  });

  describe('void', () => {
    it('REGRESSION: refuses to void a paid invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.PAID,
      });
      await expect(service.void('inv-1')).rejects.toThrow('cannot be voided');
    });
  });
});
