'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { apiGet, apiPost } from '../lib/api';
import { DonationWidget } from './donation-widget';
import { FadeInOnScroll } from './scroll-animations';

export function HomeDonationSection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const [platformDonationsEnabled, setPlatformDonationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await apiGet<{
          donationsEnabled: boolean;
          platformDonationsEnabled: boolean;
        }>('/settings/system');
        setDonationsEnabled(settings.donationsEnabled);
        setPlatformDonationsEnabled(settings.platformDonationsEnabled);
      } catch {
        // Default to hidden on error — showing a broken donation widget is worse than hiding it
        setDonationsEnabled(false);
        setPlatformDonationsEnabled(false);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [isAuthenticated]);

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
            `✅ Mobile Money payment confirmed for reference ${referenceId}. Thank you!`,
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
      window.location.href = '/auth/login?next=%2F%23donate';
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
            amount,
            currency: 'USD',
            donorEmail: email,
            paymentMethod: 'MOBILE_MONEY',
            phoneNumber,
            description: 'Change Liberia platform support',
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
          amount,
          currency: 'USD',
          donorEmail: email,
          description: 'Change Liberia platform support',
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

  if (loading || !donationsEnabled || !platformDonationsEnabled) {
    return null;
  }

  return (
    <FadeInOnScroll>
      <section id="donate" className="bg-zinc-50 dark:bg-neutral-950 section-spacing">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left — mission copy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Support the platform
              </p>
              <h2 className="headline-serif mt-3 text-4xl text-black dark:text-white lg:text-5xl">
                Help keep Change Liberia free and independent
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
                Change Liberia doesn&apos;t take sides on any issue — we just make sure your petition
                reaches the right people. Your donation keeps the platform running and pays for the
                verification that makes every signature count, no matter where in Liberia it comes
                from.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: '🔒', title: 'Signatures you can trust', desc: 'Every signer is verified, so no one can pad the numbers with fakes.' },
                  { icon: '📡', title: 'Counts update live', desc: 'Watch support grow in real time — no waiting, no guessing.' },
                  { icon: '🌍', title: 'Made to work here', desc: "Runs fine on a slow connection and an older phone, and reads in Liberian English." },
                ].map(({ icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="text-2xl leading-none">{icon}</span>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-neutral-100">{title}</p>
                      <p className="text-sm text-zinc-500 dark:text-neutral-400">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — donation widget */}
            <div>
              <DonationWidget
                onDonate={handleDonate}
                customAmounts={[5, 10, 25, 50, 100]}
              />
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
            </div>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
