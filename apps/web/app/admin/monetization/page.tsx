'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  OverviewPanel,
  PlanCatalogsTab,
  SubscriptionsPanel,
  InvoicesPanel,
  EntitlementsPanel,
  TransparencyConfigPanel,
  PetitionPromotionsPanel,
  SponsorshipPurchasesPanel,
  ServiceRequestsPanel,
} from '../../../components/admin-monetization';
import { useAdminGuard } from '../../../lib/use-admin-guard';

const TABS = [
  ['overview', 'Overview'],
  ['plans', 'Plans'],
  ['subscriptions', 'Subscriptions'],
  ['promotions', 'Petition Promotions'],
  ['sponsorship-purchases', 'Sponsorship Purchases'],
  ['service-requests', 'Studio Requests'],
  ['invoices', 'Invoices'],
  ['entitlements', 'Entitlement Grants'],
  ['transparency', 'Transparency Config'],
] as const;

type Tab = (typeof TABS)[number][0];

export default function AdminMonetizationPage() {
  const { phase, isAuthenticated } = useAdminGuard();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-zinc-500 dark:text-neutral-400">
        Checking access…
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">Access denied</h1>
          <p className="mt-3 text-red-600 dark:text-red-400">
            This page requires an Admin account.{' '}
            {!isAuthenticated && (
              <Link href="/auth/login" className="font-semibold underline">
                Sign in
              </Link>
            )}
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">Monetization</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Plans, subscriptions, invoices, entitlement grants, and public transparency for every paid product.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          &larr; Admin panel
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-zinc-200 dark:border-neutral-700">
        {TABS.map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'plans' && <PlanCatalogsTab />}
        {activeTab === 'subscriptions' && <SubscriptionsPanel />}
        {activeTab === 'promotions' && <PetitionPromotionsPanel />}
        {activeTab === 'sponsorship-purchases' && <SponsorshipPurchasesPanel />}
        {activeTab === 'service-requests' && <ServiceRequestsPanel />}
        {activeTab === 'invoices' && <InvoicesPanel />}
        {activeTab === 'entitlements' && <EntitlementsPanel />}
        {activeTab === 'transparency' && <TransparencyConfigPanel />}
      </div>
    </main>
  );
}
