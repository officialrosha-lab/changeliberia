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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const [petitionDonationsEnabled, setPetitionDonationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      setLoading(true);
      setSettingsError(false);
      try {
        const settings = await apiGet<{
          donationsEnabled: boolean;
          petitionDonationsEnabled: boolean;
        }>('/settings/system');
        if (cancelled) return;
        setDonationsEnabled(settings.donationsEnabled);
        setPetitionDonationsEnabled(settings.petitionDonationsEnabled);
      } catch {
        // Distinguish "feature intentionally off" from "couldn't load" — a
        // network blip shouldn't silently make the whole widget vanish.
        if (cancelled) return;
        setSettingsError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSettings();
    return () => { cancelled = true; };
  }, [isAuthenticated, retryKey]);

  async function pollMoMoStatus(referenceId: string) {
    if (!isAuthenticated) return;

    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await apiGet<{ success: boolean; data: { status: string } }>(
          `/payments/status/${referenceId}`,
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
    } catch {
      // The payment request itself already succeeded by the time we're
      // polling — a failure here means we couldn't confirm the final
      // status, not that the payment failed. Saying "payment failed"
      // would be actively wrong and could push a donor into retrying
      // (and being charged twice) for a payment that may still complete.
      setPaymentStatusMessage(
        `📱 Mobile Money request sent (reference ${referenceId}), but we couldn't confirm its status just now. If you approved the prompt on your phone, the payment should still go through — check back in a minute before retrying.`,
      );
    }
  }

  async function handleDonate(
    amount: number,
    frequency: 'once' | 'monthly',
    email: string,
    paymentMethod: 'CARD' | 'MOBILE_MONEY',
    phoneNumber?: string,
  ) {
    setPaymentStatusMessage(null);
    if (!isAuthenticated) {
      window.location.href = `/auth/login?next=/petitions/${petitionId}`;
      return;
    }

    try {
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
      );
      window.location.href = res.data.url;
    } catch (err) {
      // Show the specific reason here (DonationWidget's own catch only
      // shows a generic fallback and keeps the form open for retry).
      setPaymentStatusMessage(
        err instanceof Error
          ? `⚠️ Could not start your donation: ${err.message}`
          : '⚠️ Could not start your donation. Please try again.',
      );
      throw err;
    }
  }

  if (loading) {
    return null;
  }

  if (settingsError) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Couldn&apos;t load donation options right now.
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="mt-2 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!donationsEnabled || !petitionDonationsEnabled) {
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
        <div
          className={
            paymentStatusMessage.startsWith('⚠️')
              ? 'mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
              : 'mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
          }
        >
          {paymentStatusMessage}
        </div>
      )}
    </section>
  );
}
