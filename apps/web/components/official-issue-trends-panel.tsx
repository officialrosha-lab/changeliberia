'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface CategoryTrend {
  category: string | null;
  petitionCount: number;
  signaturesTotal: number;
}

interface IssueTrendsResponse {
  scope: { county: string; district?: string } | null;
  since: string | null;
  categories: CategoryTrend[];
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Past week' },
  { key: 'month', label: 'Past month' },
  { key: 'quarter', label: 'Past quarter' },
  { key: 'year', label: 'Past year' },
];

export function OfficialIssueTrendsPanel() {
  const token = useAuthStore((s) => s.token);
  const [period, setPeriod] = useState<Period>('month');
  const [result, setResult] = useState<IssueTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await apiGet<IssueTrendsResponse>(
          `/officials/me/constituency/issues?period=${period}`,
          token,
        );
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load issue trends');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, period]);

  const maxCount = result?.categories.reduce((m, c) => Math.max(m, c.petitionCount), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Constituency Issues</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            What residents are raising, by category — descriptive counts, not a ranking.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-neutral-800">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p.key
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (!result || !result.scope) && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Issue trends will appear here once your office has a county/district on file.
        </p>
      )}

      {!loading && result?.scope && result.categories.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">No approved petitions in this period yet.</p>
      )}

      {!loading && result?.scope && result.categories.length > 0 && (
        <div className="space-y-2">
          {result.categories.map((c) => (
            <div key={c.category ?? 'uncategorized'} className="rounded-xl border border-zinc-200 p-3 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-800 dark:text-neutral-200">{c.category ?? 'Uncategorized'}</span>
                <span className="text-zinc-500 dark:text-neutral-400">
                  {c.petitionCount} petition{c.petitionCount === 1 ? '' : 's'} · {c.signaturesTotal.toLocaleString()} signatures
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600"
                  style={{ width: `${maxCount > 0 ? (c.petitionCount / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
