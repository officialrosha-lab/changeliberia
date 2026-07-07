'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { HeatZoneMap } from './heat-zone-map';

interface InsightRow {
  label: string;
  count: number;
}

interface GeographicInsights {
  topCounties: InsightRow[];
  topDistricts: InsightRow[];
  mostActiveCommunities: InsightRow[];
  diasporaParticipation: number;
  directlyAffectedTotal: number;
  nearbyCommunityTotal: number;
  supporterTotal: number;
  totalClassified: number;
}

function BarGroup({ title, rows }: { title: string; rows: InsightRow[] }) {
  if (rows.length === 0) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{title}</p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-neutral-500">No data yet.</p>
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{title}</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-zinc-600 dark:text-neutral-300" title={row.label}>
              {row.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${Math.max(4, Math.round((row.count / max) * 100))}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-zinc-700 dark:text-neutral-200">
              {row.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DAY_RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '3650', label: 'All time' },
] as const;

export function AdminGeographicInsights() {
  const token = useAuthStore((s) => s.token);
  const [days, setDays] = useState('30');
  const [data, setData] = useState<GeographicInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<GeographicInsights>(`/analytics/geographic-insights?days=${days}`, token)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load geographic insights');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Geographic Insights</h2>
        <div className="flex gap-1 rounded-full border border-zinc-200 p-1 dark:border-neutral-700">
          {DAY_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setDays(r.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                days === r.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {data && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-950/30">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-700 dark:text-blue-400">Directly Affected</p>
              <p className="mt-2 text-2xl font-semibold text-blue-900 dark:text-blue-300">{data.directlyAffectedTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-purple-50 p-4 dark:bg-purple-950/30">
              <p className="text-xs uppercase tracking-[0.24em] text-purple-700 dark:text-purple-400">Nearby Community</p>
              <p className="mt-2 text-2xl font-semibold text-purple-900 dark:text-purple-300">{data.nearbyCommunityTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 dark:bg-amber-950/20">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700 dark:text-amber-400">Diaspora Participation</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-300">{data.diasporaParticipation.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-zinc-100 p-4 dark:bg-neutral-800">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-neutral-400">Total Classified</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-neutral-100">{data.totalClassified.toLocaleString()}</p>
            </div>
          </div>

          {data.topCounties.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-800">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
                Heat zones
              </p>
              <HeatZoneMap rows={data.topCounties} heightClassName="h-96" />
            </div>
          )}

          <div className="grid gap-6 rounded-3xl border border-zinc-200 p-5 dark:border-neutral-800 md:grid-cols-3">
            <BarGroup title="Top Counties" rows={data.topCounties} />
            <BarGroup title="Top Districts" rows={data.topDistricts} />
            <BarGroup title="Most Active Communities" rows={data.mostActiveCommunities} />
          </div>
        </>
      )}
    </div>
  );
}
