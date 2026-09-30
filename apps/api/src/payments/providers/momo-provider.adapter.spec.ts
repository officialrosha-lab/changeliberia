import { MoMoProviderAdapter } from './momo-provider.adapter';

describe('MoMoProviderAdapter', () => {
  const mockMoMoService = {
    isAvailable: jest.fn(),
    normalizePhoneNumber: jest.fn(),
    requestToPay: jest.fn(),
    createPreApproval: jest.fn(),
    getTransactionStatus: jest.fn(),
    generateWebhookSignature: jest.fn(),
  };

  let adapter: MoMoProviderAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MoMoProviderAdapter(mockMoMoService as never);
  });

  it('reports MOMO as its provider name', () => {
    expect(adapter.name).toBe('MOMO');
  });

  it('isAvailable delegates to MoMoService', () => {
    mockMoMoService.isAvailable.mockReturnValue(true);
    expect(adapter.isAvailable()).toBe(true);
  });

  describe('createCustomer', () => {
    it('normalizes the phone number as the customer id', async () => {
      mockMoMoService.normalizePhoneNumber.mockReturnValue('231771234567');
      const customer = await adapter.createCustomer({
        email: 'a@b.com',
        phoneNumber: '0771234567',
      });
      expect(customer).toEqual({
        id: '231771234567',
        email: 'a@b.com',
        name: null,
      });
    });

    it('throws when no phoneNumber is given', async () => {
      await expect(
        adapter.createCustomer({ email: 'a@b.com' }),
      ).rejects.toThrow('phoneNumber is required');
    });
  });

  describe('createCheckoutSession', () => {
    it('is not supported', async () => {
      await expect(
        adapter.createCheckoutSession({
          amount: 50,
          currency: 'USD',
          description: 'x',
          successUrl: 'https://a',
          cancelUrl: 'https://b',
        }),
      ).rejects.toThrow('hosted checkout');
    });
  });

  describe('chargeOneTime', () => {
    it('always returns a PENDING charge, matching the Stripe adapter', async () => {
      mockMoMoService.requestToPay.mockResolvedValue({
        referenceId: 'ref-1',
        status: 'PENDING',
        expiresAt: new Date(),
      });

      const charge = await adapter.chargeOneTime({
        amount: 50,
        currency: 'USD',
        phoneNumber: '0771234567',
      });

      expect(charge).toEqual({
        id: 'ref-1',
        amount: 50,
        currency: 'USD',
        status: 'PENDING',
      });
    });

    it('throws when no phoneNumber is given', async () => {
      await expect(
        adapter.chargeOneTime({ amount: 50, currency: 'USD' }),
      ).rejects.toThrow('phoneNumber is required');
    });
  });

  describe('cancelSubscription', () => {
    it('is not supported — MoMoService has no cancel-preapproval call', async () => {
      await expect(adapter.cancelSubscription('preapproval-1')).rejects.toThrow(
        'not supported',
      );
    });
  });

  describe('refund', () => {
    it('is not supported — MoMoService has no refund call', async () => {
      await expect(adapter.refund({ transactionId: 'ref-1' })).rejects.toThrow(
        'not supported',
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    const previousSecret = process.env.MOMO_WEBHOOK_SECRET;

    afterEach(() => {
      process.env.MOMO_WEBHOOK_SECRET = previousSecret;
    });

    it('returns false when no secret is configured', () => {
      delete process.env.MOMO_WEBHOOK_SECRET;
      expect(adapter.verifyWebhookSignature('{}', 'sig')).toBe(false);
    });

    it('returns true when the computed signature matches', () => {
      process.env.MOMO_WEBHOOK_SECRET = 'secret';
      mockMoMoService.generateWebhookSignature.mockReturnValue('a'.repeat(64));
      const payload = JSON.stringify({
        referenceId: 'ref-1',
        status: 'SUCCESSFUL',
      });
      expect(adapter.verifyWebhookSignature(payload, 'a'.repeat(64))).toBe(
        true,
      );
    });

    it('returns false when the signature does not match', () => {
      process.env.MOMO_WEBHOOK_SECRET = 'secret';
      mockMoMoService.generateWebhookSignature.mockReturnValue('a'.repeat(64));
      const payload = JSON.stringify({
        referenceId: 'ref-1',
        status: 'SUCCESSFUL',
      });
      expect(adapter.verifyWebhookSignature(payload, 'b'.repeat(64))).toBe(
        false,
      );
    });
  });
});
