'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ModeratorPendingPetitions, ModeratorStats, ModeratorFraudReview } from '../../components/moderator';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type UserRole = { role: string };

export function ModeratorPageClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [activeTab, setActiveTab] = useState<'pending' | 'fraud' | 'stats'>('pending');
  const [phase, setPhase] = useState<'loading' | 'denied' | 'ok'>('loading');

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<UserRole>('/users/me');
        if (cancelled) return;
        if (me.role !== 'MODERATOR' && me.role !== 'ADMIN') {
          setPhase('denied');
          return;
        }
        setPhase('ok');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hydrated]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="mt-4 text-zinc-600 dark:text-neutral-300">Loading…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="mt-4 text-zinc-600 dark:text-neutral-300">
          <Link href="/auth/login" className="font-semibold text-emerald-700 dark:text-emerald-400 underline">
            Sign in
          </Link>{' '}
          with a moderator account to continue.
        </p>
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="mt-4 text-zinc-600 dark:text-neutral-300">
          Your account does not have moderator access. Contact an administrator if you believe this is an error.
        </p>
        <p className="mt-4">
          <Link href="/dashboard" className="text-emerald-700 dark:text-emerald-400 underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="mt-4 text-zinc-600 dark:text-neutral-300">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <Link href="/dashboard" className="text-emerald-600 hover:underline text-sm font-medium">
          Back to Dashboard
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-neutral-700 overflow-x-auto">
        {(
          [
            ['pending', 'Pending Review'],
            ['fraud', 'Fraud Flags'],
            ['stats', 'My Statistics'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
        {activeTab === 'pending' && <ModeratorPendingPetitions />}
        {activeTab === 'fraud' && <ModeratorFraudReview />}
        {activeTab === 'stats' && <ModeratorStats />}
      </div>
    </main>
  );
}
