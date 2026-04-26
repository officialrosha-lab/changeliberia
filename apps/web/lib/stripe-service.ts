/**
 * Stripe Integration Service
 * Handles all Stripe payment processing and account management
 */

interface PaymentIntentPayload {
  campaignId: string;
  amount: number;
  currency: string;
  email: string;
  metadata: Record<string, string>;
}

interface SubscriptionPayload {
  campaignId: string;
  amount: number;
  currency: string;
  email: string;
  interval: 'month' | 'year';
  metadata: Record<string, string>;
}

interface StripeConfig {
  publicKey: string;
  secretKey?: string; // Only shown on server
}

export class StripeService {
  private publicKey: string;
  private apiVersion = '2024-04-10';
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.publicKey = config.publicKey;
  }

  /**
   * Create a payment intent for one-time donations
   */
  async createPaymentIntent(payload: PaymentIntentPayload): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      const response = await fetch('/api/donations/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(payload.amount * 100), // Convert to cents
          currency: payload.currency.toLowerCase(),
          email: payload.email,
          metadata: {
            campaignId: payload.campaignId,
            ...payload.metadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment intent creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.id,
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Failed to create payment. Please try again.');
    }
  }

  /**
   * Create a subscription for monthly donations
   */
  async createSubscription(payload: SubscriptionPayload): Promise<{
    subscriptionId: string;
    clientSecret: string;
  }> {
    try {
      const response = await fetch('/api/donations/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(payload.amount * 100),
          currency: payload.currency.toLowerCase(),
          email: payload.email,
          interval: payload.interval,
          metadata: {
            campaignId: payload.campaignId,
            ...payload.metadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Subscription creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        subscriptionId: data.subscriptionId,
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error('Failed to setup subscription. Please try again.');
    }
  }

  /**
   * Confirm payment intent with payment method
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{
    status: string;
    charges: Array<{ id: string; amount: number }>;
  }> {
    try {
      const response = await fetch('/api/donations/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment confirmation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        charges: data.charges || [],
      };
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw new Error('Payment confirmation failed. Please try again.');
    }
  }

  /**
   * Get donation campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<{
    totalRaised: number;
    donorCount: number;
    recurringDonors: number;
  }> {
    try {
      const response = await fetch(
        `/api/donations/campaigns/${campaignId}/stats`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch campaign stats:', error);
      return {
        totalRaised: 0,
        donorCount: 0,
        recurringDonors: 0,
      };
    }
  }

  /**
   * Update campaign donation settings
   */
  async updateCampaignSettings(
    campaignId: string,
    settings: {
      enabled?: boolean;
      targetAmount?: number;
      customAmounts?: number[];
    }
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/donations/campaigns/${campaignId}/settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update campaign settings: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to update campaign settings:', error);
      throw new Error('Failed to update campaign settings. Please try again.');
    }
  }

  /**
   * List all donations for a campaign (admin only)
   */
  async getDonations(campaignId: string, limit = 50, offset = 0): Promise<
    Array<{
      id: string;
      amount: number;
      currency: string;
      email: string;
      type: 'one-time' | 'recurring';
      status: 'completed' | 'pending' | 'failed';
      createdAt: Date;
      message?: string;
    }>
  > {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `/api/donations/campaigns/${campaignId}/donations?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch donations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.donations || [];
    } catch (error) {
      console.error('Failed to fetch donations:', error);
      return [];
    }
  }

  /**
   * Refund a donation
   */
  async refundDonation(chargeId: string, amount?: number): Promise<{
    refundId: string;
    status: string;
  }> {
    try {
      const response = await fetch('/api/donations/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chargeId,
          amount: amount ? Math.round(amount * 100) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        refundId: data.refundId,
        status: data.status,
      };
    } catch (error) {
      console.error('Failed to refund donation:', error);
      throw new Error('Refund failed. Please try again.');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(
        `/api/donations/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Subscription cancellation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return { status: data.status };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription. Please try again.');
    }
  }

  /**
   * Connect Stripe account (OAuth flow)
   */
  initiateStripeConnection(): void {
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID;
    if (!clientId) {
      throw new Error('Stripe Connect not configured');
    }

    const redirectUri = `${window.location.origin}/api/donations/stripe-callback`;
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('stripe_connect_state', state);

    const url = new URL('https://connect.stripe.com/oauth/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('state', state);
    url.searchParams.append('stripe_user[email]', '');
    url.searchParams.append('stripe_user[url]', window.location.origin);
    url.searchParams.append('stripe_user[country]', 'US');

    window.location.href = url.toString();
  }

  /**
   * Check if Stripe account is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch('/api/donations/stripe-status');
      if (!response.ok) return false;

      const data = await response.json();
      return data.connected === true;
    } catch {
      return false;
    }
  }

  /**
   * Get payout schedule (weekly for connected accounts)
   */
  async getPayoutSchedule(): Promise<{
    interval: string;
    delayDays: number;
    nextPayoutDate: string;
  }> {
    try {
      const response = await fetch('/api/donations/payout-schedule');
      if (!response.ok) {
        throw new Error(`Failed to fetch payout schedule: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch payout schedule:', error);
      return {
        interval: 'weekly',
        delayDays: 2,
        nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  }

  /**
   * Generate and send donation receipt
   */
  async sendReceipt(
    donationId: string,
    email: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/donations/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ donationId, email }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send receipt: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send receipt:', error);
      return { success: false };
    }
  }

  /**
   * Get webhook signing secret (for server-side verification)
   */
  getWebhookSigningSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // This should be implemented on the server side using Stripe's SDK
    // For now, we'll just return false as a placeholder
    console.warn('Webhook signature verification should be done server-side');
    return false;
  }
}

// Export singleton instance
const stripeService = new StripeService({
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
});

export default stripeService;
