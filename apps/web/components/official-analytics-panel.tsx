'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface ConstituencyData {
  county: string | null;
  district: string | null;
  petitionsCount: number;
  signaturesTotal: number;
  directlyAffectedCount: number;
  nearbyCommunityCount: number;
}

interface CategoryTrend {
  category: string | null;
  petitionCount: number;
  signaturesTotal: number;
}

interface IssueTrendsResponse {
  scope: { county: string; district?: string } | null;
  categories: CategoryTrend[];
}

/**
 * A thin visual layer over data already assembled by
 * ConstituencyFeedService/getConstituency — no new backend, per the
 * Lawmakers Portal plan's "Analytics" disposition. Combines the overview
 * stats with a year-scale category breakdown.
 */
export function OfficialAnalyticsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [overview, setOverview] = useState<ConstituencyData | null>(null);
  const [trends, setTrends] = useState<IssueTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const [overviewData, trendsData] = await Promise.all([
          apiGet<ConstituencyData>('/officials/me/constituency'),
          apiGet<IssueTrendsResponse>(
            '/officials/me/constituency/issues?period=year',
          ),
        ]);
        if (!cancelled) {
          setOverview(overviewData);
          setTrends(trendsData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (loading) return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading analytics…</p>;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  const participationRate =
    overview && overview.petitionsCount > 0
      ? Math.round(
          ((overview.directlyAffectedCount + overview.nearbyCommunityCount) /
            Math.max(overview.signaturesTotal, 1)) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Constituency Analytics</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          A high-level view of civic activity in your area over the past year.
        </p>
      </div>

      {!overview || !overview.county ? (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">
          Analytics will appear here once your office has a county/district on file.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Petitions</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-200">
                {overview.petitionsCount}
              </p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-4 dark:bg-blue-900/40">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Total signatures</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900 dark:text-blue-200">
                {overview.signaturesTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-3xl bg-purple-50 p-4 dark:bg-purple-950/30">
              <p className="text-xs uppercase tracking-[0.24em] text-purple-700 dark:text-purple-300">
                Direct + nearby participation
              </p>
              <p className="mt-2 text-3xl font-semibold text-purple-900 dark:text-purple-200">{participationRate}%</p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Issue categories (past year)</h3>
            {(!trends || trends.categories.length === 0) && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">No data yet.</p>
            )}
            {trends && trends.categories.length > 0 && (
              <div className="mt-3 space-y-2">
                {trends.categories.map((c) => (
                  <div
                    key={c.category ?? 'uncategorized'}
                    className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2 text-sm dark:bg-neutral-800"
                  >
                    <span className="font-medium text-zinc-700 dark:text-neutral-300">{c.category ?? 'Uncategorized'}</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{c.petitionCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
