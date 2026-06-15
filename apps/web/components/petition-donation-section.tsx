'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { apiGet, apiPost } from '../lib/api';
import { DonationWidget } from './donation-widget';

type PetitionDonationSectionProps = {
  petitionId: string;
  petitionTitle: string;
};

export function PetitionDonationSection({
  petitionId,
  petitionTitle,
}: PetitionDonationSectionProps) {
  const token = useAuthStore((s) => s.token);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const [petitionDonationsEnabled, setPetitionDonationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await apiGet<{
          donationsEnabled: boolean;
          petitionDonationsEnabled: boolean;
        }>('/settings/system');
        setDonationsEnabled(settings.donationsEnabled);
        setPetitionDonationsEnabled(settings.petitionDonationsEnabled);
      } catch (err) {
        // If error, default to enabled
        setDonationsEnabled(true);
        setPetitionDonationsEnabled(true);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [token]);

  async function pollMoMoStatus(referenceId: string) {
    if (!token) return;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await apiGet<{ success: boolean; data: { status: string } }>(
        `/payments/status/${referenceId}`,
        token,
      );

      const status = response.data.status;
      if (status === 'COMPLETED' || status === 'SUCCESSFUL') {
        setPaymentStatusMessage(
          `✅ Mobile Money payment confirmed for reference ${referenceId}. Thank you for your support!`,
        );
        return;
      }

      if (status === 'FAILED') {
        setPaymentStatusMessage(
          `⚠️ Mobile Money payment failed for reference ${referenceId}. Please retry or use card.`,
        );
        return;
      }

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setPaymentStatusMessage(
      `⏳ Mobile Money request sent. Reference ${referenceId}. If your phone prompt completed, check again in a minute.`,
    );
  }

  async function handleDonate(
    amount: number,
    frequency: 'once' | 'monthly',
    email: string,
    paymentMethod: 'CARD' | 'MOBILE_MONEY',
    phoneNumber?: string,
  ) {
    setPaymentStatusMessage(null);
    if (!token) {
      window.location.href = `/auth/login?next=/petitions/${petitionId}`;
      return;
    }

    if (paymentMethod === 'MOBILE_MONEY') {
      const res = await apiPost<{
        success: boolean;
        data: { referenceId: string; status: string; expiresAt: string };
      }>(
        '/payments/create',
        {
          petitionId,
          amount,
          currency: 'USD',
          donorEmail: email,
          paymentMethod: 'MOBILE_MONEY',
          phoneNumber,
          description: `Donation to petition ${petitionTitle}`,
        },
        token,
      );

      setPaymentStatusMessage(
        `📱 Mobile Money request sent to ${phoneNumber}. Reference ${res.data.referenceId}. Checking payment status...`,
      );
      await pollMoMoStatus(res.data.referenceId);
      return;
    }

    const res = await apiPost<{ success: boolean; data: { url: string } }>(
      '/payments/checkout',
      {
        petitionId,
        amount,
        currency: 'USD',
        donorEmail: email,
        description: `Donation to petition ${petitionTitle}`,
        recurringInterval: frequency === 'monthly' ? 'monthly' : undefined,
      },
      token,
    );
    window.location.href = res.data.url;
  }

  if (loading || !donationsEnabled || !petitionDonationsEnabled) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Support this petition
        </p>
        <h2 className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-white">
          Donate to this campaign
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
          Choose card or MTN Mobile Money and help move this petition forward.
        </p>
      </div>
      <DonationWidget onDonate={handleDonate} customAmounts={[5, 10, 25, 50, 100]} />
      {paymentStatusMessage && (
        <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {paymentStatusMessage}
        </div>
      )}
    </section>
  );
}
