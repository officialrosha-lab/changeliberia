import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { MoMoService } from './providers/momo.service';
import type { StripeEvent } from '../config/stripe.config';

// `expect.objectContaining` is typed to return `any`, so nesting it as the
// value of an object literal property trips no-unsafe-assignment. This
// wraps it with the sample's own inferred type so the matcher stays
// type-safe at the call site.
function matching<T extends object>(sample: T): T {
  return expect.objectContaining(sample) as unknown as T;
}

// Mock factories (rather than a single shared object) so every test starts
// from the same fresh, non-`any` mocks the old per-test `useValue` literal
// gave them — several tests here override a mock's resolved value
// persistently (not `mockResolvedValueOnce`), so a shared instance would
// leak state between tests.
function createMockPrisma() {
  return {
    petition: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    },
    payment: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue(null),
    },
    paymentIntent: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    donation: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
    },
    checkoutSession: {
      create: jest.fn().mockResolvedValue(null),
    },
    subscription: {
      create: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue(null),
    },
    paymentMethodRecord: {
      create: jest.fn().mockResolvedValue(null),
    },
    refund: {
      create: jest.fn().mockResolvedValue(null),
    },
  };
}

/**
 * Payment Service Unit Tests
 * Tests Stripe integration, payment intents, subscriptions, and webhook handling
 */
describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let stripe: ReturnType<typeof createMockStripe>;

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
  };

  const mockPaymentIntent = {
    id: 'pi_test123',
    client_secret: 'pi_test123_secret',
    amount: 5000, // $50
    currency: 'usd',
    status: 'succeeded',
    metadata: {},
    payment_method: 'pm_test123',
    latest_charge: 'ch_test123',
  };

  const mockSubscription = {
    id: 'sub_test123',
    customer: 'cus_test123',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    items: {
      data: [{ id: 'si_test123' }],
    },
  };

  // Mock Stripe (factory — see createMockPrisma for why)
  function createMockStripe() {
    return {
      paymentIntents: {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
        confirm: jest.fn().mockResolvedValue(mockPaymentIntent),
        retrieve: jest.fn().mockResolvedValue(mockPaymentIntent),
      },
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_test123',
            url: 'https://checkout.stripe.com',
            amount_total: 5000,
            currency: 'usd',
            payment_status: 'unpaid',
          }),
        },
      },
      paymentMethods: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'pm_test123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
          },
        }),
      },
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_test123',
        }),
      },
      subscriptions: {
        create: jest.fn().mockResolvedValue(mockSubscription),
        retrieve: jest.fn().mockResolvedValue(mockSubscription),
        update: jest.fn().mockResolvedValue(mockSubscription),
        del: jest.fn().mockResolvedValue(mockSubscription),
        cancel: jest.fn().mockResolvedValue(mockSubscription),
      },
      prices: {
        create: jest.fn().mockResolvedValue({
          id: 'price_test123',
        }),
      },
      products: {
        create: jest.fn().mockResolvedValue({
          id: 'prod_test123',
        }),
      },
      refunds: {
        create: jest.fn().mockResolvedValue({
          id: 'ref_test123',
          status: 'succeeded',
        }),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };
  }

  beforeEach(async () => {
    prisma = createMockPrisma();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MoMoService,
          useValue: {
            isAvailable: jest.fn().mockReturnValue(true),
            generateIdempotencyKey: jest.fn().mockReturnValue('momo-key'),
            requestToPay: jest.fn().mockResolvedValue({
              referenceId: 'ref_test123',
              status: 'PENDING',
              expiresAt: new Date(),
              transactionId: 'tx_test123',
            }),
            getTransactionStatus: jest.fn().mockResolvedValue({
              status: 'SUCCESSFUL',
              transactionId: 'tx_test123',
              failureReason: undefined,
            }),
            createPreApproval: jest.fn().mockResolvedValue({
              expiresAt: new Date(),
            }),
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<PaymentService>(PaymentService);

    // Mock Stripe
    stripe = createMockStripe();

    (service as unknown as { stripe: typeof stripe }).stripe = stripe;
  });

  describe('Payment Intent Creation', () => {
    it('should create a payment intent for donation', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'intent-1',
        stripeIntentId: 'pi_test123',
      } as any);

      const result = await service.createPaymentIntent({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        donorEmail: 'donor@example.com',
      });

      expect(result.id).toBe('pi_test123');
      expect(result.clientSecret).toBe('pi_test123_secret');
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000, // 50 * 100
          currency: 'usd',
        }),
      );
    });

    it('should throw error for non-existent petition', async () => {
      prisma.petition.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent({
          petitionId: 'invalid',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include metadata in payment intent', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.paymentIntent.create.mockResolvedValue({} as any);

      await service.createPaymentIntent({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        donorEmail: 'donor@example.com',
        metadata: { customField: 'customValue' },
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: matching({
            petitionId: 'petition-1',
            userId: 'user-1',
            customField: 'customValue',
          }),
        }),
      );
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment and update payment status', async () => {
      const storedPayment = {
        id: 'payment-1',
        stripePaymentIntentId: 'pi_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
      };

      prisma.payment.findUnique.mockResolvedValue(storedPayment as any);
      prisma.payment.update.mockResolvedValue({
        ...storedPayment,
        status: 'COMPLETED',
      } as any);
      prisma.paymentMethodRecord.create.mockResolvedValue({} as any);

      const result = await service.confirmPayment('pi_test123', 'pm_test123');

      expect(result.paymentId).toBe('payment-1');
      expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test123',
        expect.objectContaining({
          payment_method: 'pm_test123',
        }),
      );
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: matching({ status: 'COMPLETED' }),
        }),
      );
      expect(prisma.paymentMethodRecord.create).toHaveBeenCalled();
    });

    it('should create a payment method record after confirmation', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        stripePaymentIntentId: 'pi_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
      } as any);
      prisma.payment.update.mockResolvedValue({
        id: 'payment-1',
        stripePaymentIntentId: 'pi_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
      } as any);
      prisma.paymentMethodRecord.create.mockResolvedValue({} as any);

      await service.confirmPayment('pi_test123', 'pm_test123');

      expect(prisma.paymentMethodRecord.create).toHaveBeenCalled();
    });
  });

  describe('Checkout Session', () => {
    it('should create checkout session for one-time donation', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.checkoutSession.create.mockResolvedValue({} as any);

      const result = await service.createCheckoutSession({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        donorEmail: 'donor@example.com',
      });

      expect(result.id).toBe('cs_test123');
      expect(result.status).toBe('unpaid');
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
        }),
      );
    });

    it('should create subscription checkout session', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.checkoutSession.create.mockResolvedValue({} as any);

      await service.createCheckoutSession({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        donorEmail: 'donor@example.com',
        recurringInterval: 'monthly',
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
        }),
      );
    });
  });

  describe('Subscriptions', () => {
    it('should create subscription for recurring donation', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        petitionId: 'petition-1',
        status: 'active',
        interval: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        nextBillingDate: new Date(),
      } as any);

      const result = await service.createSubscription({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        donorEmail: 'donor@example.com',
        recurringInterval: 'monthly',
      });

      expect(result.id).toBe('sub-1');
      expect(result.interval).toBe('monthly');
      expect(stripe.subscriptions.create).toHaveBeenCalled();
    });

    it('should throw error when recurring interval not provided', async () => {
      await expect(
        service.createSubscription({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update subscription amount', async () => {
      const stored = {
        id: 'sub-1',
        stripeSubscriptionId: 'sub_test123',
        amount: 50,
        currency: 'USD',
        interval: 'monthly' as const,
      };

      prisma.subscription.findUnique.mockResolvedValue(stored as any);
      prisma.subscription.update.mockResolvedValue({
        ...stored,
        amount: 75,
      } as any);

      const result = await service.updateSubscription('sub-1', 75, {
        userId: 'user-1',
        role: 'ADMIN',
      });

      expect(result.amount).toBe(75);
    });

    it('REGRESSION (Milestone 12 read cutover): does not issue a spurious Stripe price change when the requested amount already matches the Decimal-sourced stored amount', async () => {
      const stored = {
        id: 'sub-1',
        stripeSubscriptionId: 'sub_test123',
        // The stale Float column disagrees with the Decimal column — the
        // comparison must use the Decimal-resolved value (50), not the
        // Float (999), or this would wrongly detect a change and call out
        // to Stripe for a no-op price update.
        amount: 999,
        amountDecimal: { toNumber: () => 50 },
        currency: 'USD',
        interval: 'monthly' as const,
      };

      prisma.subscription.findUnique.mockResolvedValue(stored as any);

      const result = await service.updateSubscription('sub-1', 50, {
        userId: 'user-1',
        role: 'ADMIN',
      });

      expect(stripe.products.create).not.toHaveBeenCalled();
      expect(result.amount).toBe(50);
    });

    it('should cancel subscription', async () => {
      const stored = {
        id: 'sub-1',
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
      };

      prisma.subscription.findUnique.mockResolvedValue(stored as any);
      prisma.subscription.update.mockResolvedValue({
        ...stored,
        status: 'canceled',
        canceledAt: new Date(),
      } as any);

      const result = await service.cancelSubscription('sub-1', {
        userId: 'user-1',
        role: 'ADMIN',
      });

      expect(result.status).toBe('canceled');
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
    });
  });

  describe('Payment Status', () => {
    it('should retrieve payment status', async () => {
      const paymentRecord = {
        id: 'payment-1',
        userId: 'user-1',
        stripePaymentIntentId: 'pi_test123',
        paymentMethod: 'CARD',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.payment.findUnique.mockResolvedValue(paymentRecord as any);
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.getPaymentStatus('pi_test123', {
        userId: 'user-1',
        role: 'USER',
      });

      expect(result?.paymentId).toBe('payment-1');
      expect(result?.amount).toBe(50);
    });

    it('should throw error for non-existent payment', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus('invalid', {
          userId: 'user-1',
          role: 'USER',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when accessing another user’s payment', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        userId: 'user-1',
        status: 'COMPLETED',
      } as any);
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus('payment-1', {
          userId: 'user-2',
          role: 'USER',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Payment History', () => {
    it('should get user payment history', async () => {
      const payments = [
        {
          id: 'payment-1',
          paymentIntentId: 'pi_test1',
          paymentMethodId: 'pm_test1',
          amount: 50,
          currency: 'USD',
        },
        {
          id: 'payment-2',
          paymentIntentId: 'pi_test2',
          paymentMethodId: 'pm_test2',
          amount: 100,
          currency: 'USD',
        },
      ];

      prisma.payment.findMany.mockResolvedValue(payments as any);
      prisma.paymentIntent.findUnique.mockResolvedValue({} as any);

      const history = await service.getUserPaymentHistory('user-1');

      expect(history.length).toBe(2);
      expect(history[0].amount).toBe(50);
    });

    it('should order payment history by date descending', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      await service.getUserPaymentHistory('user-1');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('REGRESSION (Milestone 12 read cutover): prefers amountDecimal over the legacy Float amount', async () => {
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'payment-1',
          amount: 999,
          amountDecimal: { toNumber: () => 50 },
          currency: 'USD',
        },
      ] as any);

      const history = await service.getUserPaymentHistory('user-1');

      expect(history[0].amount).toBe(50);
    });

    it('falls back to the legacy Float amount when amountDecimal is null', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'payment-1', amount: 50, amountDecimal: null, currency: 'USD' },
      ] as any);

      const history = await service.getUserPaymentHistory('user-1');

      expect(history[0].amount).toBe(50);
    });
  });

  describe('Refunds', () => {
    it('should refund a payment', async () => {
      const payment = {
        id: 'payment-1',
        stripePaymentIntentId: 'pi_test123',
        amount: 50,
        currency: 'USD',
      };

      prisma.payment.findUnique.mockResolvedValue(payment as any);
      prisma.refund.create.mockResolvedValue({
        id: 'refund-1',
        paymentId: 'payment-1',
        stripeRefundId: 'ref_test123',
        amount: 50,
        currency: 'USD',
        reason: 'requested_by_customer',
        status: 'succeeded',
        createdAt: new Date(),
      } as any);

      const result = await service.refundPayment(
        'payment-1',
        'requested_by_customer',
      );

      expect(result.refundId).toBe('refund-1');
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        charge: 'ch_test123',
        reason: 'requested_by_customer',
      });
    });

    it('REGRESSION (Milestone 12 read cutover): refund response amount prefers the stored Decimal value', async () => {
      const payment = {
        id: 'payment-1',
        stripePaymentIntentId: 'pi_test123',
        amount: 999,
        currency: 'USD',
      };

      prisma.payment.findUnique.mockResolvedValue(payment as any);
      prisma.refund.create.mockResolvedValue({
        id: 'refund-1',
        paymentId: 'payment-1',
        amount: 999,
        amountDecimal: { toNumber: () => 50 },
        currency: 'USD',
        reason: 'requested_by_customer',
        status: 'succeeded',
        createdAt: new Date(),
      } as any);

      const result = await service.refundPayment(
        'payment-1',
        'requested_by_customer',
      );

      expect(result.amount).toBe(50);
    });

    it('should throw error for non-existent payment', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.refundPayment('invalid', 'requested_by_customer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment intent succeeded webhook', async () => {
      prisma.payment.updateMany.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: mockPaymentIntent },
      } as unknown as StripeEvent);

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripePaymentIntentId: mockPaymentIntent.id },
          data: matching({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should handle subscription deleted webhook', async () => {
      prisma.subscription.updateMany.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      } as unknown as StripeEvent);

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: mockSubscription.id },
          data: matching({ status: 'CANCELLED' }),
        }),
      );
    });

    it('should handle invoice payment succeeded webhook', async () => {
      prisma.subscription.updateMany.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            parent: {
              subscription_details: { subscription: mockSubscription.id },
            },
          },
        },
      } as unknown as StripeEvent);

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: mockSubscription.id },
          data: matching({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe errors gracefully', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      stripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        service.createPaymentIntent({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        }),
      ).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      prisma.petition.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createPaymentIntent({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Amount Conversion', () => {
    it('should convert dollars to cents correctly', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.paymentIntent.create.mockResolvedValue({} as any);

      await service.createPaymentIntent({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 25.99,
        currency: 'USD',
        donorEmail: 'donor@example.com',
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2599,
        }),
      );
    });

    it('should handle large amounts', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.paymentIntent.create.mockResolvedValue({} as any);

      await service.createPaymentIntent({
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 10000,
        currency: 'USD',
        donorEmail: 'donor@example.com',
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000000,
        }),
      );
    });
  });

  describe('Currency Support', () => {
    it('should support multiple currencies', async () => {
      prisma.petition.findUnique.mockResolvedValue(mockPetition as any);
      prisma.paymentIntent.create.mockResolvedValue({} as any);

      const currencies = ['USD', 'EUR', 'GBP', 'JPY'];

      for (const currency of currencies) {
        await service.createPaymentIntent({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency,
          donorEmail: 'donor@example.com',
        });
      }

      expect(stripe.paymentIntents.create).toHaveBeenCalledTimes(4);
    });
  });
});
