'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InstitutionsManager, ContactsManager, CSVImporter, RoutingAnalytics } from '../../../components/admin-directory';
import { AdminGuard } from '../../../components/admin-guard';
import { apiGet } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

type Phase = 'loading' | 'denied' | 'ok';

export default function AdminDirectoryPage() {
  const token = useAuthStore((s) => s.token);
  const [phase, setPhase] = useState<Phase>('loading');
  const [activeTab, setActiveTab] = useState<'institutions' | 'contacts' | 'import' | 'analytics'>('institutions');

  useEffect(() => {
    if (!token) {
      setPhase('denied');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<{ role: string }>('/users/me', token);
        if (cancelled) return;
        setPhase(me.role === 'ADMIN' ? 'ok' : 'denied');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-zinc-500">
        Checking access…
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-700">Access denied</h1>
          <p className="mt-3 text-red-600">
            This page requires an Admin account.{' '}
            {!token && (
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
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">Contact Directory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage government institutions, departments, and routing contacts.
          </p>
        </div>
        <Link href="/admin" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          ← Admin panel
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200">
        {(['institutions', 'contacts', 'import', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab === 'import' ? 'CSV Import' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
            className="rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <h3 className="font-semibold text-zinc-800">{label}</h3>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </button>
        ))}
      </div>
    </main>
  );
}
