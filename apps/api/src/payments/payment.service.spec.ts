import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

/**
 * Payment Service Unit Tests
 * Tests Stripe integration, payment intents, subscriptions, and webhook handling
 */
describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: jest.Mocked<PrismaService>;
  let stripe: any; // Stripe mock

  const mockPetition = {
    id: 'petition-1',
    title: 'Test Petition',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
  };

  const mockPaymentIntent = {
    id: 'pi_test123',
    client_secret: 'pi_test123_secret',
    amount: 5000, // $50
    currency: 'usd',
    status: 'succeeded',
    metadata: {},
    payment_method: 'pm_test123',
    charges: {
      data: [{ id: 'ch_test123' }],
    },
  };

  const mockSubscription = {
    id: 'sub_test123',
    customer: 'cus_test123',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            petition: {
              findUnique: jest.fn().mockResolvedValue(null) as any,
              create: jest.fn().mockResolvedValue(null) as any,
            },
            paymentIntent: {
              create: jest.fn().mockResolvedValue(null) as any,
              findUnique: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
            donation: {
              create: jest.fn().mockResolvedValue(null) as any,
              findFirst: jest.fn().mockResolvedValue(null) as any,
              findMany: jest.fn().mockResolvedValue([]) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
            checkoutSession: {
              create: jest.fn().mockResolvedValue(null) as any,
            },
            subscription: {
              create: jest.fn().mockResolvedValue(null) as any,
              findUnique: jest.fn().mockResolvedValue(null) as any,
              findFirst: jest.fn().mockResolvedValue(null) as any,
              update: jest.fn().mockResolvedValue(null) as any,
            },
            facebookPixelEvent: {
              create: jest.fn().mockResolvedValue(null) as any,
            },
            refund: {
              create: jest.fn().mockResolvedValue(null) as any,
            },
          },
        },
      ],
    }).compile();

    service = moduleFixture.get<PaymentService>(PaymentService);
    prisma = moduleFixture.get(PrismaService) as jest.Mocked<PrismaService>;

    // Mock Stripe
    stripe = {
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
    } as any;

    (service as any).stripe = stripe;
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
          metadata: expect.objectContaining({
            petitionId: 'petition-1',
            userId: 'user-1',
            customField: 'customValue',
          }),
        }),
      );
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment and create donation', async () => {
      const storedIntent = {
        stripeIntentId: 'pi_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
      };

      prisma.paymentIntent.findUnique.mockResolvedValue(storedIntent as any);
      prisma.donation.create.mockResolvedValue({
        id: 'donation-1',
        ...storedIntent,
      } as any);

      const result = await service.confirmPayment('pi_test123', 'pm_test123');

      expect(result.paymentId).toBe('donation-1');
      expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test123',
        expect.objectContaining({
          payment_method: 'pm_test123',
        }),
      );
      expect(prisma.donation.create).toHaveBeenCalled();
    });

    it('should track donation as Facebook Purchase event', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        stripeIntentId: 'pi_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
      } as any);

      prisma.donation.create.mockResolvedValue({
        id: 'donation-1',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
      } as any);

      await service.confirmPayment('pi_test123', 'pm_test123');

      expect(prisma.facebookPixelEvent.create).toHaveBeenCalled();
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

      const result = await service.updateSubscription('sub-1', 75);

      expect(result.amount).toBe(75);
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

      const result = await service.cancelSubscription('sub-1');

      expect(result.status).toBe('canceled');
      expect(stripe.subscriptions.del).toHaveBeenCalledWith('sub_test123');
    });
  });

  describe('Payment Status', () => {
    it('should retrieve payment status', async () => {
      const storedIntent = {
        stripeIntentId: 'pi_test123',
        petitionId: 'petition-1',
      };

      const donation = {
        id: 'donation-1',
        paymentIntentId: 'pi_test123',
        paymentMethodId: 'pm_test123',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.paymentIntent.findUnique.mockResolvedValue(storedIntent as any);
      prisma.donation.findFirst.mockResolvedValue(donation as any);

      const result = await service.getPaymentStatus('pi_test123');

      expect(result?.paymentId).toBe('donation-1');
      expect(result?.amount).toBe(50);
    });

    it('should return null for non-existent payment', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue(null);

      const result = await service.getPaymentStatus('invalid');

      expect(result).toBeNull();
    });
  });

  describe('Payment History', () => {
    it('should get user payment history', async () => {
      const donations = [
        {
          id: 'donation-1',
          paymentIntentId: 'pi_test1',
          paymentMethodId: 'pm_test1',
          amount: 50,
          currency: 'USD',
        },
        {
          id: 'donation-2',
          paymentIntentId: 'pi_test2',
          paymentMethodId: 'pm_test2',
          amount: 100,
          currency: 'USD',
        },
      ];

      prisma.donation.findMany.mockResolvedValue(donations as any);
      prisma.paymentIntent.findUnique.mockResolvedValue({} as any);

      const history = await service.getUserPaymentHistory('user-1');

      expect(history.length).toBe(2);
      expect(history[0].amount).toBe(50);
    });

    it('should order payment history by date descending', async () => {
      prisma.donation.findMany.mockResolvedValue([]);

      await service.getUserPaymentHistory('user-1');

      expect(prisma.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('Refunds', () => {
    it('should refund a payment', async () => {
      const donation = {
        id: 'donation-1',
        paymentIntentId: 'pi_test123',
        amount: 50,
        currency: 'USD',
      };

      prisma.donation.findUnique.mockResolvedValue(donation as any);
      prisma.refund.create.mockResolvedValue({
        id: 'refund-1',
        donationId: 'donation-1',
        stripeRefundId: 'ref_test123',
        amount: 50,
        currency: 'USD',
        reason: 'requested_by_customer',
        status: 'succeeded',
        createdAt: new Date(),
      } as any);

      const result = await service.refundPayment(
        'donation-1',
        'requested_by_customer',
      );

      expect(result.refundId).toBe('refund-1');
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        reason: 'requested_by_customer',
      });
    });

    it('should throw error for non-existent donation', async () => {
      prisma.donation.findUnique.mockResolvedValue(null);

      await expect(
        service.refundPayment('invalid', 'requested_by_customer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment intent succeeded webhook', async () => {
      prisma.paymentIntent.update.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: mockPaymentIntent },
      } as Stripe.Event);

      expect(prisma.paymentIntent.update).toHaveBeenCalled();
    });

    it('should handle charge refunded webhook', async () => {
      const charge = {
        id: 'ch_test123',
        payment_intent: 'pi_test123',
        refunded: true,
      };

      const donation = { id: 'donation-1' };

      prisma.donation.findFirst.mockResolvedValue(donation as any);
      prisma.donation.update.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'charge.refunded',
        data: { object: charge },
      } as any);

      expect(prisma.donation.update).toHaveBeenCalledWith({
        where: { id: 'donation-1' },
        data: { status: 'REFUNDED' },
      });
    });

    it('should handle subscription updated webhook', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };

      const stored = { id: 'sub-1', stripeSubscriptionId: 'sub_test123' };

      prisma.subscription.findFirst.mockResolvedValue(stored as any);
      prisma.subscription.update.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'customer.subscription.updated',
        data: { object: subscription },
      } as any);

      expect(prisma.subscription.update).toHaveBeenCalled();
    });

    it('should handle invoice payment succeeded webhook', async () => {
      const invoice = {
        id: 'inv_test123',
        subscription: 'sub_test123',
        payment_intent: 'pi_test123',
      };

      const subscription = {
        id: 'sub-1',
        stripeSubscriptionId: 'sub_test123',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
      };

      prisma.subscription.findFirst.mockResolvedValue(subscription as any);
      prisma.donation.create.mockResolvedValue({} as any);

      await service.handleWebhookEvent({
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
      } as any);

      expect(prisma.donation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          petitionId: 'petition-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
        }),
      });
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
      prisma.petition.findUnique.mockRejectedValue(
        new Error('Database error'),
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
