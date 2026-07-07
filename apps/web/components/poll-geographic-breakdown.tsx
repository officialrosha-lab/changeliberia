'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

interface InsightRow {
  label: string;
  count: number;
}

interface GeographicBreakdown {
  total: number;
  byCounty: InsightRow[];
  byDistrict: InsightRow[];
  byCommunity: InsightRow[];
}

function BarGroup({ title, rows }: { title: string; rows: InsightRow[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{title}</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs font-medium text-zinc-600 dark:text-neutral-300" title={row.label}>
              {row.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${Math.max(4, Math.round((row.count / max) * 100))}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-zinc-700 dark:text-neutral-200">
              {row.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PollGeographicBreakdown({ pollId }: { pollId: string }) {
  const [data, setData] = useState<GeographicBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<GeographicBreakdown>(`/polls/${pollId}/geographic-breakdown`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {/* best-effort */});
    return () => {
      cancelled = true;
    };
  }, [pollId]);

  if (!data || data.total === 0) return null;
  if (data.byCounty.length === 0 && data.byDistrict.length === 0 && data.byCommunity.length === 0) return null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Geographic participation
      </p>
      <div className="space-y-4">
        <BarGroup title="By County" rows={data.byCounty} />
        <BarGroup title="By District" rows={data.byDistrict} />
        <BarGroup title="By Community" rows={data.byCommunity} />
      </div>
    </div>
  );
}
