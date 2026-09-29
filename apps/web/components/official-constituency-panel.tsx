'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface ConstituencyData {
  county: string | null;
  district: string | null;
  petitionsCount: number;
  signaturesTotal: number;
  topCategories: Array<{ category: string | null; count: number }>;
  directlyAffectedCount: number;
  nearbyCommunityCount: number;
  topAffectedAreas: Array<{ community: string; count: number }>;
}

export function OfficialConstituencyPanel() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<ConstituencyData | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiGet<ConstituencyData>('/officials/me/constituency', token);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!data) return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading constituency data…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">My Constituency</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Approved petitions</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-200">{data.petitionsCount}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-900/40">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Total signatures</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900 dark:text-blue-200">{data.signaturesTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-purple-50 p-4 dark:bg-purple-950/30">
          <p className="text-xs uppercase tracking-[0.24em] text-purple-700 dark:text-purple-300">Directly affected residents</p>
          <p className="mt-2 text-3xl font-semibold text-purple-900 dark:text-purple-200">{data.directlyAffectedCount.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-zinc-100 p-4 dark:bg-neutral-800">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-neutral-300">Nearby community support</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">{data.nearbyCommunityCount.toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Top categories</h3>
        <div className="mt-3 space-y-2">
          {data.topCategories.map((c) => (
            <div key={c.category ?? 'uncategorized'} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm dark:bg-neutral-800">
              <span className="font-medium text-zinc-700 dark:text-neutral-300">{c.category ?? 'Uncategorized'}</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{c.count}</span>
            </div>
          ))}
          {data.topCategories.length === 0 && <p className="text-sm text-zinc-500 dark:text-neutral-400">No data yet.</p>}
        </div>
      </div>
      {data.topAffectedAreas.length > 0 && (
        <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Most affected communities</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">Where concern is most concentrated in your county.</p>
          <div className="mt-3 space-y-2">
            {data.topAffectedAreas.map((a) => (
              <div key={a.community} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm dark:bg-neutral-800">
                <span className="font-medium text-zinc-700 dark:text-neutral-300">{a.community}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
