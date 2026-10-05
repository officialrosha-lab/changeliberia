'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface DashboardData {
  institution: { id: string; name: string; county: string | null; district: string | null };
  petitionsByStage: Array<{ stage: string; count: number }>;
  totalPetitions: number;
  unreadInboxCount: number;
  directlyAffectedCount: number;
}

export function OfficialDashboardOverview() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiGet<DashboardData>('/officials/me/dashboard');
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading overview…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{data.institution.name}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          {[data.institution.county, data.institution.district].filter(Boolean).join(' · ') || 'National'}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
        Basic constituency access — petitions, Civic Pulse results, and notifications for your area — is free for
        every verified official, permanently. Optional advanced tools are billed separately and never affect what
        you see here.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Assigned petitions</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-200">{data.totalPetitions}</p>
        </div>
        <div className="rounded-3xl bg-purple-50 p-4 dark:bg-purple-950/30">
          <p className="text-xs uppercase tracking-[0.24em] text-purple-700 dark:text-purple-300">Directly affected</p>
          <p className="mt-2 text-3xl font-semibold text-purple-900 dark:text-purple-200">{data.directlyAffectedCount.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-900/40">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Unread inbox</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900 dark:text-blue-200">{data.unreadInboxCount}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4 dark:bg-neutral-800">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Stages tracked</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">{data.petitionsByStage.length}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Petitions by stage</h3>
        <div className="mt-3 space-y-2">
          {data.petitionsByStage.map((s) => (
            <div key={s.stage} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm dark:bg-neutral-800">
              <span className="font-medium text-zinc-700 dark:text-neutral-300">{s.stage.replaceAll('_', ' ')}</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{s.count}</span>
            </div>
          ))}
          {data.petitionsByStage.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-neutral-400">No petitions routed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
