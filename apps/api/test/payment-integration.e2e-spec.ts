import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PaymentService } from '../src/payments/payment.service';
import { PaymentWebhookService } from '../src/payments/payment-webhook.service';
import { MoMoWebhookService } from '../src/payments/momo-webhook.service';
import { PrismaService } from '../src/prisma/prisma.service';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const payload = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');

  try {
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

jest.setTimeout(300000);

/**
 * Payment Integration E2E Tests
 * Tests complete payment flows including checkout, subscriptions, and webhooks
 */
describe('Payment Integration (e2e)', () => {
  let app: INestApplication<App>;
  let paymentService: jest.Mocked<PaymentService>;
  let prismaService: PrismaService;
  let paymentWebhookService: jest.Mocked<PaymentWebhookService>;
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentService)
      .useValue({
        createPaymentIntent: jest.fn(),
        confirmPayment: jest.fn(),
        createCheckoutSession: jest.fn(),
        getPaymentStatus: jest.fn(),
        createSubscription: jest.fn(),
        updateSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        getUserPaymentHistory: jest.fn(),
        refundPayment: jest.fn(),
        handleWebhookEvent: jest.fn(),
      })
      .overrideProvider(PaymentWebhookService)
      .useValue({ processWebhook: jest.fn((req: any) => {
        const signature = req?.headers?.['stripe-signature'];
        if (!signature) {
          throw new BadRequestException('Missing Stripe signature');
        }
        return Promise.resolve(undefined);
      }) })
      .overrideProvider(MoMoWebhookService)
      .useValue({ handleWebhook: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    paymentService = moduleFixture.get(PaymentService) as jest.Mocked<PaymentService>;
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    paymentWebhookService = moduleFixture.get(
      PaymentWebhookService,
    ) as jest.Mocked<PaymentWebhookService>;

    const server = app.getHttpAdapter().getInstance() as any;
    if (server && server._router && Array.isArray(server._router.stack)) {
      console.log('REGISTERED PAYMENT ROUTES:');
      server._router.stack
        .filter((layer: any) => layer.route && layer.route.path)
        .forEach((layer: any) => {
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          console.log(methods, layer.route.path);
        });
    }

    await setupTestData();
  });

  async function setupTestData() {
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'paymentuser@example.com',
        phone: '+231770000010',
        fullName: 'Payment User',
      });

    if (!userResponse.body?.accessToken) {
      throw new Error(
        `Signup failed: status=${userResponse.status} body=${JSON.stringify(
          userResponse.body,
        )}`,
      );
    }

    userToken = `Bearer ${userResponse.body.accessToken}`;
    const decodedToken = decodeJwtPayload(userResponse.body.accessToken);
    if (!decodedToken || typeof decodedToken !== 'object' || !('sub' in decodedToken)) {
      throw new Error('Unable to decode user ID from access token');
    }
    testUserId = String(decodedToken.sub);
  }

  afterAll(async () => {
    await app.close();
  });

  describe('One-Time Donation Flow', () => {
    it('should create payment intent for donation', () => {
      paymentService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test123',
        clientSecret: 'secret_123',
        amount: 5000,
        currency: 'USD',
        status: 'requires_payment_method',
      });

      return request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe('pi_test123');
          expect(res.body.data.clientSecret).toBe('secret_123');
        });
    });

    it('should confirm payment with payment method', () => {
      paymentService.confirmPayment.mockResolvedValue({
        paymentId: 'donation-1',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        type: 'one-time',
        method: {
          id: 'pm_test123',
          type: 'card',
          brand: 'visa',
          lastFourDigits: '4242',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/api/payments/confirm/pi_test123')
        .set('Authorization', userToken)
        .send({
          paymentMethodId: 'pm_test123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.paymentId).toBe('donation-1');
          expect(res.body.data.status).toBe('COMPLETED');
        });
    });

    it('should get payment status', () => {
      paymentService.getPaymentStatus.mockResolvedValue({
        paymentId: 'donation-1',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        type: 'one-time',
        method: {
          id: 'pm_test123',
          type: 'card',
          brand: 'visa',
          lastFourDigits: '4242',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .get('/api/payments/status/pi_test123')
        .set('Authorization', userToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('COMPLETED');
        });
    });
  });

  describe('Stripe Checkout Flow', () => {
    it('should create checkout session', () => {
      paymentService.createCheckoutSession.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
        amountTotal: 5000,
        currency: 'USD',
        status: 'unpaid',
      });

      return request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.url).toBeDefined();
          expect(res.body.data.status).toBe('unpaid');
        });
    });

    it('should create checkout for subscription', () => {
      paymentService.createCheckoutSession.mockResolvedValue({
        id: 'cs_sub_123',
        url: 'https://checkout.stripe.com/sub',
        amountTotal: 5000,
        currency: 'USD',
        status: 'unpaid',
      });

      return request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
          recurringInterval: 'monthly',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Subscription Management', () => {
    it('should create recurring subscription', () => {
      paymentService.createSubscription.mockResolvedValue({
        id: 'sub-1',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        nextBillingDate: new Date(),
        createdAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/api/payments/subscription')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
          recurringInterval: 'monthly',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.interval).toBe('monthly');
          expect(res.body.data.status).toBe('active');
        });
    });

    it('should update subscription amount', () => {
      paymentService.updateSubscription.mockResolvedValue({
        id: 'sub-1',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 75,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        nextBillingDate: new Date(),
        createdAt: new Date(),
      });

      return request(app.getHttpServer())
        .put('/api/payments/subscription/sub-1')
        .set('Authorization', userToken)
        .send({
          amount: 75,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.amount).toBe(75);
        });
    });

    it('should cancel subscription', () => {
      paymentService.cancelSubscription.mockResolvedValue({
        id: 'sub-1',
        petitionId: 'petition-1',
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        interval: 'monthly',
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        nextBillingDate: new Date(),
        createdAt: new Date(),
        canceledAt: new Date(),
      });

      return request(app.getHttpServer())
        .delete('/api/payments/subscription/sub-1')
        .set('Authorization', userToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('canceled');
        });
    });
  });

  describe('Payment History', () => {
    it('should get user payment history', () => {
      paymentService.getUserPaymentHistory.mockResolvedValue([
        {
          paymentId: 'donation-1',
          amount: 50,
          currency: 'USD',
          status: 'COMPLETED',
          type: 'one-time',
          method: {
            id: 'pm_test1',
            type: 'card',
            brand: 'visa',
            lastFourDigits: '4242',
          },
          createdAt: new Date('2026-04-10'),
          updatedAt: new Date('2026-04-10'),
        },
        {
          paymentId: 'donation-2',
          amount: 100,
          currency: 'USD',
          status: 'COMPLETED',
          type: 'recurring',
          method: {
            id: 'pm_test2',
            type: 'card',
            brand: 'mastercard',
            lastFourDigits: '5555',
          },
          createdAt: new Date('2026-04-01'),
          updatedAt: new Date('2026-04-01'),
        },
      ]);

      return request(app.getHttpServer())
        .get('/api/payments/history/user-1')
        .set('Authorization', userToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBe(2);
          expect(res.body.data[0].amount).toBe(50);
        });
    });
  });

  describe('Refunds', () => {
    it('should refund a payment', () => {
      paymentService.refundPayment.mockResolvedValue({
        refundId: 'ref-1',
        paymentId: 'donation-1',
        amount: 50,
        currency: 'USD',
        reason: 'requested_by_customer',
        status: 'succeeded',
        createdAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/api/payments/refund/donation-1')
        .set('Authorization', userToken)
        .send({
          reason: 'requested_by_customer',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.refundId).toBe('ref-1');
          expect(res.body.data.status).toBe('succeeded');
        });
    });

    it('should require refund reason', () => {
      return request(app.getHttpServer())
        .post('/api/payments/refund/donation-1')
        .set('Authorization', userToken)
        .send({})
        .expect(400);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment intent succeeded webhook', () => {
      return request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send({ type: 'payment_intent.succeeded' })
        .expect(201);
    });

    it('should reject webhook without signature', () => {
      return request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send({ type: 'payment_intent.succeeded' })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment intent', () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Invalid amount'),
      );

      return request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: -50, // Invalid
          currency: 'USD',
          donorEmail: 'donor@example.com',
        })
        .expect(500);
    });

    it('should handle missing petition', () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Petition not found'),
      );

      return request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'invalid',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        })
        .expect(500);
    });
  });

  describe('Multiple Currencies', () => {
    it('should support USD donations', () => {
      paymentService.createPaymentIntent.mockResolvedValue({
        id: 'pi_usd',
        clientSecret: 'secret',
        amount: 5000,
        currency: 'USD',
        status: 'requires_payment_method',
      });

      return request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        })
        .expect(201);
    });

    it('should support EUR donations', () => {
      paymentService.createPaymentIntent.mockResolvedValue({
        id: 'pi_eur',
        clientSecret: 'secret',
        amount: 4500,
        currency: 'EUR',
        status: 'requires_payment_method',
      });

      return request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 45,
          currency: 'EUR',
          donorEmail: 'donor@example.com',
        })
        .expect(201);
    });
  });

  describe('Complete Donation Workflow', () => {
    it('should complete full donation flow', async () => {
      // Step 1: Create payment intent
      paymentService.createPaymentIntent.mockResolvedValue({
        id: 'pi_workflow',
        clientSecret: 'secret',
        amount: 5000,
        currency: 'USD',
        status: 'requires_payment_method',
      });

      const intentRes = await request(app.getHttpServer())
        .post('/api/payments/intent')
        .set('Authorization', userToken)
        .send({
          petitionId: 'petition-1',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          donorEmail: 'donor@example.com',
        });

      expect(intentRes.status).toBe(201);

      // Step 2: Confirm payment
      paymentService.confirmPayment.mockResolvedValue({
        paymentId: 'donation-workflow',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        type: 'one-time',
        method: {
          id: 'pm_workflow',
          type: 'card',
          brand: 'visa',
          lastFourDigits: '4242',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const confirmRes = await request(app.getHttpServer())
        .post('/api/payments/confirm/pi_workflow')
        .set('Authorization', userToken)
        .send({
          paymentMethodId: 'pm_workflow',
        });

      expect(confirmRes.status).toBe(201);

      // Step 3: Check status
      paymentService.getPaymentStatus.mockResolvedValue({
        paymentId: 'donation-workflow',
        amount: 50,
        currency: 'USD',
        status: 'COMPLETED',
        type: 'one-time',
        method: {
          id: 'pm_workflow',
          type: 'card',
          brand: 'visa',
          lastFourDigits: '4242',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const statusRes = await request(app.getHttpServer())
        .get('/api/payments/status/pi_workflow')
        .set('Authorization', userToken);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('COMPLETED');
    });
  });
});
