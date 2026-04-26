'use client';

import { useAuthStore } from '../lib/store';
import { apiPost } from '../lib/api';
import { DonationWidget } from './donation-widget';
import { FadeInOnScroll } from './scroll-animations';

export function HomeDonationSection() {
  const token = useAuthStore((s) => s.token);

  async function handleDonate(amount: number, frequency: 'once' | 'monthly', email: string) {
    if (!token) {
      window.location.href = '/auth/login?next=%2F%23donate';
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
      token,
    );
    window.location.href = res.data.url;
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
                Change Liberia is a non-partisan civic platform built to give every Liberian a
                verified voice. Your donation funds the infrastructure that connects citizens with
                decision-makers — from Monrovia to the most rural counties.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: '🔒', title: 'Fraud-resistant signatures', desc: 'Every signature is verified to protect petition integrity.' },
                  { icon: '📡', title: 'Real-time transparency', desc: 'Live signature counts show the true weight of public support.' },
                  { icon: '🌍', title: 'Built for Liberia', desc: 'Local language support, low-bandwidth optimised, and mobile-first.' },
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
            </div>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
