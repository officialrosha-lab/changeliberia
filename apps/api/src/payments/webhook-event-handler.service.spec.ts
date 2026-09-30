import { Prisma } from '@prisma/client';
import { WebhookEventHandlerService } from './webhook-event-handler.service';
import type {
  StripeInvoice,
  StripeSubscription,
} from '../config/stripe.config';

/**
 * REGRESSION: Stripe's `price.unit_amount`/`invoice.amount_paid`/
 * `invoice.amount_due` are minor units (cents), but every amount column in
 * this codebase stores major units (dollars) — confirmed against
 * payment.service.spec.ts's own fixtures. Four handlers in this file
 * previously wrote the raw Stripe cents value straight into the dollars
 * column, inflating stored amounts 100x whenever these webhooks fired.
 * These tests lock in the fix (divide by 100) and the dual-write of
 * amountDecimal introduced alongside it.
 */
describe('WebhookEventHandlerService', () => {
  const mockPrisma = {
    user: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    subscription: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
    },
    payment: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    membershipSubscription: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    organizationSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    institutionSubscription: {
      update: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };

  const mockActivityLogger = { logAsync: jest.fn() };
  const mockEntitlementsService = { grant: jest.fn(), revoke: jest.fn() };

  let service: WebhookEventHandlerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookEventHandlerService(
      mockPrisma as never,
      mockActivityLogger as never,
      mockEntitlementsService as never,
      null,
    );
  });

  describe('customer.subscription.created', () => {
    it('REGRESSION: stores unit_amount (cents) converted to dollars, not raw cents', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.subscription.upsert.mockResolvedValue({});

      const subscription = {
        id: 'sub_1',
        customer: 'cus_1',
        items: {
          data: [
            {
              current_period_start: 1000,
              current_period_end: 2000,
              price: { unit_amount: 5000, recurring: { interval: 'month' } },
            },
          ],
        },
      } as unknown as StripeSubscription;

      await service.handleWebhookEvent({
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as never);

      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 50,
            amountDecimal: new Prisma.Decimal(50),
          }) as unknown,
        }),
      );
    });

    it('REGRESSION (Milestone 9): activates an OrganizationSubscription instead of the generic donation Subscription when metadata carries organizationSubscriptionId', async () => {
      mockPrisma.organizationSubscription.update.mockResolvedValue({
        id: 'os-1',
        organizationId: 'org-1',
        plan: { entitlementKeys: '[]' },
      });

      const subscription = {
        id: 'sub_1',
        customer: 'cus_1',
        metadata: { organizationSubscriptionId: 'os-1' },
        items: {
          data: [{ current_period_start: 1000, current_period_end: 2000 }],
        },
      } as unknown as StripeSubscription;

      await service.handleWebhookEvent({
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as never);

      expect(mockPrisma.organizationSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'os-1' } }),
      );
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('REGRESSION (Milestone 9): activates an InstitutionSubscription instead of the generic donation Subscription when metadata carries institutionSubscriptionId', async () => {
      mockPrisma.institutionSubscription.update.mockResolvedValue({
        id: 'is-1',
        institutionId: 'inst-1',
        plan: { entitlementKeys: '[]' },
      });

      const subscription = {
        id: 'sub_1',
        customer: 'cus_1',
        metadata: { institutionSubscriptionId: 'is-1' },
        items: {
          data: [{ current_period_start: 1000, current_period_end: 2000 }],
        },
      } as unknown as StripeSubscription;

      await service.handleWebhookEvent({
        type: 'customer.subscription.created',
        data: { object: subscription },
      } as never);

      expect(mockPrisma.institutionSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'is-1' } }),
      );
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated', () => {
    it('REGRESSION: stores the updated price converted to dollars, not raw cents', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'db-sub-1',
        userId: 'user-1',
        amount: 50,
      });
      mockPrisma.subscription.update.mockResolvedValue({});

      const subscription = {
        id: 'sub_1',
        items: { data: [{ price: { unit_amount: 7500 } }] },
      } as unknown as StripeSubscription;

      await service.handleWebhookEvent({
        type: 'customer.subscription.updated',
        data: { object: subscription },
      } as never);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'db-sub-1' },
          data: expect.objectContaining({ amount: 75 }) as unknown,
        }),
      );
    });

    it('falls back to the existing stored amount when Stripe sends no price', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'db-sub-1',
        userId: 'user-1',
        amount: 50,
      });
      mockPrisma.subscription.update.mockResolvedValue({});

      const subscription = {
        id: 'sub_1',
        items: { data: [{ price: {} }] },
      } as unknown as StripeSubscription;

      await service.handleWebhookEvent({
        type: 'customer.subscription.updated',
        data: { object: subscription },
      } as never);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 50 }) as unknown,
        }),
      );
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('REGRESSION: stores amount_paid (cents) converted to dollars, not raw cents', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'db-sub-1',
        userId: 'user-1',
      });
      mockPrisma.payment.upsert.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null); // short-circuits queueInvoiceReceiptEmail

      const invoice = {
        id: 'in_1',
        parent: { subscription_details: { subscription: 'sub_1' } },
        amount_paid: 5000,
        currency: 'usd',
      } as unknown as StripeInvoice;

      await service.handleWebhookEvent({
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
      } as never);

      expect(mockPrisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 50,
            amountDecimal: new Prisma.Decimal(50),
          }) as unknown,
        }),
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('REGRESSION: stores amount_due (cents) converted to dollars, not raw cents', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'db-sub-1',
        userId: 'user-1',
      });
      mockPrisma.payment.upsert.mockResolvedValue({});

      const invoice = {
        id: 'in_1',
        parent: { subscription_details: { subscription: 'sub_1' } },
        amount_due: 5000,
        currency: 'usd',
      } as unknown as StripeInvoice;

      await service.handleWebhookEvent({
        type: 'invoice.payment_failed',
        data: { object: invoice },
      } as never);

      expect(mockPrisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 50,
            amountDecimal: new Prisma.Decimal(50),
          }) as unknown,
        }),
      );
    });

    it('REGRESSION (Milestone 9): marks membership, organization, and institution subscriptions past due when no generic Subscription matches', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const invoice = {
        id: 'in_1',
        parent: { subscription_details: { subscription: 'sub_1' } },
        amount_due: 5000,
        currency: 'usd',
      } as unknown as StripeInvoice;

      await service.handleWebhookEvent({
        type: 'invoice.payment_failed',
        data: { object: invoice },
      } as never);

      expect(mockPrisma.membershipSubscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerSubscriptionId: 'sub_1' } }),
      );
      expect(
        mockPrisma.organizationSubscription.updateMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerSubscriptionId: 'sub_1' } }),
      );
      expect(
        mockPrisma.institutionSubscription.updateMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerSubscriptionId: 'sub_1' } }),
      );
    });
  });
});
