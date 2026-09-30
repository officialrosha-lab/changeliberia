'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface LabeledCount {
  label: string;
  count: number;
}

interface CommunityInsightsResponse {
  scope: { county: string; district?: string } | null;
  byCounty: LabeledCount[];
  byDistrict: LabeledCount[];
  byCommunity: LabeledCount[];
  diasporaTotal: number;
}

function BarGroup({ title, rows }: { title: string; rows: LabeledCount[] }) {
  if (rows.length === 0) return null;
  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-neutral-300">{title}</h3>
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-zinc-200 p-3 dark:border-neutral-700">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-800 dark:text-neutral-200">{row.label}</span>
              <span className="text-zinc-500 dark:text-neutral-400">
                {row.count} signature{row.count === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600"
                style={{ width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OfficialCommunityPanel() {
  const token = useAuthStore((s) => s.token);
  const [result, setResult] = useState<CommunityInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await apiGet<CommunityInsightsResponse>(
          '/officials/me/constituency/community',
          token,
        );
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const hasAnyRows =
    !!result &&
    (result.byCounty.length > 0 || result.byDistrict.length > 0 || result.byCommunity.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Community</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Where signatures on your constituency&apos;s petitions are coming from — aggregate counts
          only, never individual signer locations.
        </p>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>}

      {!loading && (!result || !result.scope) && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Community insights will appear here once your office has a county/district on file.
        </p>
      )}

      {!loading && result?.scope && !hasAnyRows && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          No signature location data for your constituency&apos;s petitions yet.
        </p>
      )}

      {!loading && result?.scope && hasAnyRows && (
        <div className="space-y-5">
          <BarGroup title="By county" rows={result.byCounty} />
          <BarGroup title="By district" rows={result.byDistrict} />
          <BarGroup title="By community" rows={result.byCommunity} />
          {result.diasporaTotal > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              {result.diasporaTotal} signature{result.diasporaTotal === 1 ? '' : 's'} from
              diaspora supporters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
