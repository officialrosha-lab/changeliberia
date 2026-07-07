'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface DashboardData {
  institution: { id: string; name: string; county: string | null; district: string | null };
  petitionsByStage: Array<{ stage: string; count: number }>;
  totalPetitions: number;
  unreadInboxCount: number;
}

export function OfficialDashboardOverview() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiGet<DashboardData>('/officials/me/dashboard', token);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Loading overview…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900">{data.institution.name}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {[data.institution.county, data.institution.district].filter(Boolean).join(' · ') || 'National'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Assigned petitions</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{data.totalPetitions}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Unread inbox</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{data.unreadInboxCount}</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Stages tracked</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.petitionsByStage.length}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 p-5">
        <h3 className="text-lg font-semibold text-zinc-900">Petitions by stage</h3>
        <div className="mt-3 space-y-2">
          {data.petitionsByStage.map((s) => (
            <div key={s.stage} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm">
              <span className="font-medium text-zinc-700">{s.stage.replaceAll('_', ' ')}</span>
              <span className="font-semibold text-zinc-900">{s.count}</span>
            </div>
          ))}
          {data.petitionsByStage.length === 0 && (
            <p className="text-sm text-zinc-500">No petitions routed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
