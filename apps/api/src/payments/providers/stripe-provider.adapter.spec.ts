import { StripeProviderAdapter } from './stripe-provider.adapter';

function createMockStripe() {
  return {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    products: {
      create: jest.fn(),
    },
    prices: {
      create: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
}

describe('StripeProviderAdapter', () => {
  let adapter: StripeProviderAdapter;
  let stripe: ReturnType<typeof createMockStripe>;

  beforeEach(() => {
    const previousKey = process.env.STRIPE_API_KEY;
    process.env.STRIPE_API_KEY = 'sk_test_fake';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
    adapter = new StripeProviderAdapter();
    process.env.STRIPE_API_KEY = previousKey;

    stripe = createMockStripe();
    (adapter as unknown as { stripe: typeof stripe }).stripe = stripe;
  });

  it('reports STRIPE as its provider name', () => {
    expect(adapter.name).toBe('STRIPE');
  });

  it('createCustomer returns a provider-agnostic customer', async () => {
    stripe.customers.create.mockResolvedValue({
      id: 'cus_1',
      email: 'a@b.com',
      name: 'A B',
    });

    const customer = await adapter.createCustomer({
      email: 'a@b.com',
      name: 'A B',
    });

    expect(customer).toEqual({ id: 'cus_1', email: 'a@b.com', name: 'A B' });
  });

  it('createCheckoutSession converts the amount to cents for Stripe and back to dollars in the response', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_1',
      url: 'https://checkout.stripe.com/cs_1',
      amount_total: 5000,
      currency: 'usd',
      payment_status: 'unpaid',
    });

    const session = await adapter.createCheckoutSession({
      amount: 50,
      currency: 'USD',
      description: 'Test',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 5000,
            }) as unknown,
          }),
        ],
      }),
    );
    expect(session.amountTotal).toBe(50);
  });

  it('tags the resulting Subscription with the same metadata for subscription-mode sessions (needed so webhook handlers, e.g. MembershipsService, can recognize it)', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_1',
      url: 'https://checkout.stripe.com/cs_1',
      amount_total: 5000,
      currency: 'usd',
      payment_status: 'unpaid',
    });

    await adapter.createCheckoutSession({
      amount: 50,
      currency: 'USD',
      description: 'Supporter Monthly',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
      recurringInterval: 'monthly',
      metadata: { membershipSubscriptionId: 'ms_1' },
    });

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { membershipSubscriptionId: 'ms_1' },
        subscription_data: { metadata: { membershipSubscriptionId: 'ms_1' } },
      }),
    );
  });

  it('does not set subscription_data for a one-time (non-recurring) checkout session', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_1',
      url: 'https://checkout.stripe.com/cs_1',
      amount_total: 5000,
      currency: 'usd',
      payment_status: 'unpaid',
    });

    await adapter.createCheckoutSession({
      amount: 50,
      currency: 'USD',
      description: 'Donation',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
    });

    const calls = stripe.checkout.sessions.create.mock
      .calls as unknown as Record<string, unknown>[][];
    expect(calls[0][0].subscription_data).toBeUndefined();
  });

  it('chargeOneTime always returns a PENDING charge', async () => {
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_1',
      amount: 5000,
      currency: 'usd',
    });

    const charge = await adapter.chargeOneTime({
      amount: 50,
      currency: 'USD',
    });

    expect(charge).toEqual({
      id: 'pi_1',
      amount: 50,
      currency: 'usd',
      status: 'PENDING',
    });
  });

  it('cancelSubscription calls stripe.subscriptions.cancel', async () => {
    stripe.subscriptions.cancel.mockResolvedValue({});
    await adapter.cancelSubscription('sub_1');
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_1');
  });

  it('verifyWebhookSignature returns false when construction throws', () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });
    expect(adapter.verifyWebhookSignature('{}', 'bad-sig')).toBe(false);
  });

  it('verifyWebhookSignature returns true when construction succeeds', () => {
    stripe.webhooks.constructEvent.mockReturnValue({});
    expect(adapter.verifyWebhookSignature('{}', 'good-sig')).toBe(true);
  });

  it('parseWebhookEvent maps the constructed event to a provider-agnostic shape', () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });

    const event = adapter.parseWebhookEvent('{}', 'sig');

    expect(event).toEqual({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { id: 'pi_1' },
    });
  });

  it('isAvailable is false when unconfigured', () => {
    const previousKey = process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_API_KEY;
    const unconfigured = new StripeProviderAdapter();
    process.env.STRIPE_API_KEY = previousKey;

    expect(unconfigured.isAvailable()).toBe(false);
  });
});
