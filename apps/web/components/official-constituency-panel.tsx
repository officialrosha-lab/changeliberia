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

interface PetitionFeedIndicators {
  isRecentlyCreated: boolean;
  isHighParticipation: boolean;
  isRapidlyGrowing: boolean;
  isAwaitingResponse: boolean;
}

interface PetitionFeedItem {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  county: string | null;
  district: string | null;
  signaturesCount: number;
  goal: number;
  status: string;
  createdAt: string;
  indicators: PetitionFeedIndicators;
}

interface PetitionFeedResponse {
  scope: { county: string; district?: string } | null;
  data: PetitionFeedItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const INDICATOR_LABELS: Array<{ key: keyof PetitionFeedIndicators; label: string; className: string }> = [
  { key: 'isRecentlyCreated', label: 'New', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  {
    key: 'isHighParticipation',
    label: 'High participation',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  {
    key: 'isRapidlyGrowing',
    label: 'Rapidly growing',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300',
  },
  {
    key: 'isAwaitingResponse',
    label: 'Awaiting response',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
];

export function OfficialConstituencyPanel() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<ConstituencyData | null>(null);
  const [feed, setFeed] = useState<PetitionFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const [result, feedResult] = await Promise.all([
          apiGet<ConstituencyData>('/officials/me/constituency', token),
          apiGet<PetitionFeedResponse>('/officials/me/constituency/petitions', token),
        ]);
        if (!cancelled) {
          setData(result);
          setFeed(feedResult);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load constituency data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading constituency data…</p>;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

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
      {feed && feed.data.length > 0 && (
        <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Constituency petitions</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Approved petitions concerning your area — descriptive flags, not a ranking.
          </p>
          <div className="mt-3 space-y-3">
            {feed.data.map((p) => (
              <div key={p.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
                <p className="font-semibold text-zinc-900 dark:text-white break-words">{p.title}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400 break-words">{p.summary}</p>
                <p className="mt-2 text-xs text-zinc-400 dark:text-neutral-500">
                  {p.category ?? 'Uncategorized'} · {p.signaturesCount.toLocaleString()} / {p.goal.toLocaleString()} signatures
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INDICATOR_LABELS.filter((i) => p.indicators[i.key]).map((i) => (
                    <span key={i.key} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${i.className}`}>
                      {i.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
