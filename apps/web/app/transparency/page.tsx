'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

interface TransparencyOverview {
  enabled: boolean;
  civicPrinciple: string;
  asOf?: string;
  totalOneTimeRevenueCollected?: number;
  totalRecurringMonthlyRevenue?: number;
  payingMembers?: number;
  payingOrganizations?: number;
  payingInstitutions?: number;
  lifetimePromotionsPurchased?: number;
  lifetimeSponsorshipsPurchased?: number;
  lifetimeResearchProductsSold?: number;
  lifetimePaidEventRegistrations?: number;
}

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<TransparencyOverview>('/transparency/overview')
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Transparency</h1>
        <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500 dark:text-neutral-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Transparency
        </p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-900 dark:text-white">Where the money goes</h1>
      </div>

      <div className="mb-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-lg font-medium leading-relaxed text-emerald-900 dark:text-emerald-200">
          {data.civicPrinciple}
        </p>
      </div>

      {!data.enabled ? (
        <p className="text-center text-zinc-500 dark:text-neutral-400">
          Detailed figures aren&apos;t published yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
              Revenue
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="One-time purchases collected (all time)" value={money(data.totalOneTimeRevenueCollected ?? 0)} />
              <StatCard label="Recurring revenue (estimated monthly)" value={money(data.totalRecurringMonthlyRevenue ?? 0)} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
              Who&apos;s paying in
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Paying individual members" value={String(data.payingMembers ?? 0)} />
              <StatCard label="Paying organizations" value={String(data.payingOrganizations ?? 0)} />
              <StatCard label="Paying government institutions" value={String(data.payingInstitutions ?? 0)} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
              Lifetime activity
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Petition promotions purchased" value={String(data.lifetimePromotionsPurchased ?? 0)} />
              <StatCard label="Sponsorships purchased" value={String(data.lifetimeSponsorshipsPurchased ?? 0)} />
              <StatCard label="Research reports sold" value={String(data.lifetimeResearchProductsSold ?? 0)} />
              <StatCard label="Paid event registrations" value={String(data.lifetimePaidEventRegistrations ?? 0)} />
            </div>
          </section>

          {data.asOf && (
            <p className="text-center text-xs text-zinc-400 dark:text-neutral-500">
              As of {new Date(data.asOf).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
