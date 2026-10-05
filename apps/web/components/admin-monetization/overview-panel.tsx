'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Card } from '../ui/card';

interface DashboardSummary {
  asOf: string;
  oneTimeRevenue: {
    petitionPromotions: number;
    sponsorships: number;
    researchProducts: number;
    events: number;
    total: number;
  };
  recurringMonthlyRevenue: {
    memberships: number;
    organizations: number;
    institutions: number;
    apiPlans: number;
    total: number;
  };
  activeCounts: {
    payingMembers: number;
    payingOrganizations: number;
    payingInstitutions: number;
    apiSubscribers: number;
    activeSponsorships: number;
    activePromotions: number;
  };
  lifetimeCounts: {
    promotionsPurchased: number;
    sponsorshipsPurchased: number;
    researchProductsSold: number;
    paidEventRegistrations: number;
    freeEventRegistrations: number;
  };
  needsAttention: {
    draftInvoices: number;
    pastDueSubscriptions: number;
    openServiceRequests: number;
    unfulfilledSponsorshipPurchases: number;
  };
}

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card rounded="2xl" className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">{hint}</p>}
    </Card>
  );
}

export function OverviewPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiGet<DashboardSummary>('/admin/monetization/dashboard')
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!summary) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading dashboard…</div>;
  }

  const needsAttentionTotal =
    summary.needsAttention.draftInvoices +
    summary.needsAttention.pastDueSubscriptions +
    summary.needsAttention.openServiceRequests +
    summary.needsAttention.unfulfilledSponsorshipPurchases;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Every figure below is what the platform collects for optional tools, distribution, and professional
          services. Creating, signing, following, and viewing a petition — and Civic Pulse — stays free forever, for
          everyone.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
          One-time revenue collected (all time)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={money(summary.oneTimeRevenue.total)} />
          <StatCard label="Petition promotions" value={money(summary.oneTimeRevenue.petitionPromotions)} />
          <StatCard label="Sponsorships" value={money(summary.oneTimeRevenue.sponsorships)} />
          <StatCard label="Research products" value={money(summary.oneTimeRevenue.researchProducts)} />
          <StatCard label="Paid events" value={money(summary.oneTimeRevenue.events)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
          Recurring revenue (estimated monthly run-rate)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total MRR" value={money(summary.recurringMonthlyRevenue.total)} />
          <StatCard label="Memberships" value={money(summary.recurringMonthlyRevenue.memberships)} />
          <StatCard label="Organizations" value={money(summary.recurringMonthlyRevenue.organizations)} />
          <StatCard label="Institutions" value={money(summary.recurringMonthlyRevenue.institutions)} />
          <StatCard label="API plans" value={money(summary.recurringMonthlyRevenue.apiPlans)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
          Active right now
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Paying members" value={String(summary.activeCounts.payingMembers)} />
          <StatCard label="Paying organizations" value={String(summary.activeCounts.payingOrganizations)} />
          <StatCard label="Paying institutions" value={String(summary.activeCounts.payingInstitutions)} />
          <StatCard label="API subscribers" value={String(summary.activeCounts.apiSubscribers)} />
          <StatCard label="Active sponsorships" value={String(summary.activeCounts.activeSponsorships)} />
          <StatCard label="Active promotions" value={String(summary.activeCounts.activePromotions)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
          Needs attention
          {needsAttentionTotal > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              {needsAttentionTotal}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Draft invoices" value={String(summary.needsAttention.draftInvoices)} hint="Ready to issue" />
          <StatCard
            label="Past-due subscriptions"
            value={String(summary.needsAttention.pastDueSubscriptions)}
            hint="Renewal payment failed"
          />
          <StatCard
            label="Open service requests"
            value={String(summary.needsAttention.openServiceRequests)}
            hint="Submitted or scoping"
          />
          <StatCard
            label="Unfulfilled sponsorships"
            value={String(summary.needsAttention.unfulfilledSponsorshipPurchases)}
            hint="Paid, no logo-wall entry yet"
          />
        </div>
      </section>

      <p className="text-xs text-zinc-400 dark:text-neutral-500">
        As of {new Date(summary.asOf).toLocaleString()}
      </p>
    </div>
  );
}
