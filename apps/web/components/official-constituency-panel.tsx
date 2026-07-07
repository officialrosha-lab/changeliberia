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

  if (!data) return <p className="text-sm text-zinc-500">Loading constituency data…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-zinc-900">My Constituency</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Approved petitions</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{data.petitionsCount}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Total signatures</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{data.signaturesTotal.toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-zinc-200 p-5">
        <h3 className="text-lg font-semibold text-zinc-900">Top categories</h3>
        <div className="mt-3 space-y-2">
          {data.topCategories.map((c) => (
            <div key={c.category ?? 'uncategorized'} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm">
              <span className="font-medium text-zinc-700">{c.category ?? 'Uncategorized'}</span>
              <span className="font-semibold text-zinc-900">{c.count}</span>
            </div>
          ))}
          {data.topCategories.length === 0 && <p className="text-sm text-zinc-500">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
