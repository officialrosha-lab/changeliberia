'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface PollIndicators {
  isRecentlyCreated: boolean;
  isHighParticipation: boolean;
}

interface PollFeedItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  county: string | null;
  district: string | null;
  status: string;
  totalVotes: number;
  expiresAt: string;
  createdAt: string;
  indicators: PollIndicators;
}

interface PollFeedResponse {
  scope: { county: string; district?: string } | null;
  data: PollFeedItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CLOSED: 'Closed',
};

export function OfficialCivicPulsePanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [result, setResult] = useState<PollFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet<PollFeedResponse>(
          '/officials/me/constituency/polls',
        );
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Civic Pulse activity');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading Civic Pulse activity…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!result || !result.scope) {
    return (
      <p className="text-sm text-zinc-500 dark:text-neutral-400">
        Civic Pulse activity will appear here once your office has a county/district on file.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Civic Pulse</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Polls relevant to {result.scope.district ? `${result.scope.district}, ` : ''}
          {result.scope.county}.
        </p>
      </div>
      {result.data.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">No Civic Pulse polls in your constituency yet.</p>
      )}
      {result.data.map((poll) => (
        <div key={poll.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white break-words">{poll.title}</p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-neutral-500">
                {poll.category} · {poll.totalVotes.toLocaleString()} responses
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {poll.indicators.isRecentlyCreated && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    New
                  </span>
                )}
                {poll.indicators.isHighParticipation && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    High participation
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
              {STATUS_LABEL[poll.status] ?? poll.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
