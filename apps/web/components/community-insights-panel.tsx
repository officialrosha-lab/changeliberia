'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiGetBlob } from '../lib/api';
import { HeatZoneMap } from './heat-zone-map';

interface InsightRow {
  label: string;
  count: number;
}

interface CommunityInsights {
  byCounty: InsightRow[];
  byDistrict: InsightRow[];
  byCommunity: InsightRow[];
  diasporaTotal: number;
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

const REPORT_FORMATS = [
  { format: 'csv', label: 'CSV', ext: 'csv' },
  { format: 'excel', label: 'Excel', ext: 'xlsx' },
  { format: 'pdf', label: 'PDF', ext: 'pdf' },
] as const;

export function CommunityInsightsPanel({ petitionId }: { petitionId: string }) {
  const [insights, setInsights] = useState<CommunityInsights | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function downloadReport(format: (typeof REPORT_FORMATS)[number]) {
    setDownloading(format.format);
    try {
      const blob = await apiGetBlob(`/petitions/${petitionId}/report/${format.format}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `petition-${petitionId}-impact-report.${format.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* best-effort */
    } finally {
      setDownloading(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiGet<CommunityInsights>(`/petitions/${petitionId}/community-insights`)
      .then((data) => {
        if (!cancelled) setInsights(data);
      })
      .catch(() => {/* best-effort */});
    return () => {
      cancelled = true;
    };
  }, [petitionId]);

  if (!insights) return null;

  const hasAnyData =
    insights.byCounty.length > 0 ||
    insights.byDistrict.length > 0 ||
    insights.byCommunity.length > 0 ||
    insights.diasporaTotal > 0;

  if (!hasAnyData) return null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-neutral-50">Community Insights</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Where support for this petition is coming from — aggregated only, never individual locations.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {REPORT_FORMATS.map((format) => (
            <button
              key={format.format}
              type="button"
              disabled={downloading === format.format}
              onClick={() => void downloadReport(format)}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300"
            >
              {downloading === format.format ? '…' : format.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {insights.byCounty.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
              Heat zones
            </p>
            <div className="mt-2">
              <HeatZoneMap rows={insights.byCounty} heightClassName="h-64" />
            </div>
          </div>
        )}
        <BarGroup title="Support by County" rows={insights.byCounty} />
        <BarGroup title="Support by District" rows={insights.byDistrict} />
        <BarGroup title="Support by Community" rows={insights.byCommunity} />

        {insights.diasporaTotal > 0 && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Diaspora support
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-amber-900 dark:text-amber-300">
              {insights.diasporaTotal.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
