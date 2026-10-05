'use client';

import Link from 'next/link';
import { useState } from 'react';
import { InstitutionsManager, ContactsManager, CSVImporter, RoutingAnalytics } from '../../../components/admin-directory';
import { useAdminGuard } from '../../../lib/use-admin-guard';

export default function AdminDirectoryPage() {
  const { phase, isAuthenticated } = useAdminGuard();
  const [activeTab, setActiveTab] = useState<'institutions' | 'contacts' | 'import' | 'analytics'>('institutions');

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
          <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
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
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">Contact Directory</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Manage government institutions, departments, and routing contacts.
          </p>
        </div>
        <Link href="/admin" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          ← Admin panel
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-neutral-700">
        {(['institutions', 'contacts', 'import', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {tab === 'import' ? 'CSV Import' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        {activeTab === 'institutions' && <InstitutionsManager />}
        {activeTab === 'contacts' && <ContactsManager />}
        {activeTab === 'import' && <CSVImporter />}
        {activeTab === 'analytics' && <RoutingAnalytics />}
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Manage Institutions', desc: 'Add, edit, and verify institutions', tab: 'institutions' as const },
          { label: 'Bulk Import', desc: 'Import institutions from CSV', tab: 'import' as const },
          { label: 'Contacts', desc: 'Manage government submission contacts', tab: 'contacts' as const },
          { label: 'Analytics', desc: 'Routing and delivery statistics', tab: 'analytics' as const },
        ].map(({ label, desc, tab }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
          >
            <h3 className="font-semibold text-zinc-800 dark:text-neutral-100">{label}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">{desc}</p>
          </button>
        ))}
      </div>
    </main>
  );
}
