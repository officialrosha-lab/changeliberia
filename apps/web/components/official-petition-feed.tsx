'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

const STAGES = [
  'RECEIVED',
  'ASSIGNED',
  'UNDER_REVIEW',
  'INVESTIGATION',
  'ACTION_PLANNED',
  'IMPLEMENTATION',
  'RESOLVED',
  'CLOSED',
] as const;

interface CollaboratingInstitution {
  id: string;
  name: string;
  slug: string | null;
  stage: string;
}

interface FeedItem {
  id: string;
  currentStage: string;
  petition: {
    id: string;
    title: string;
    summary: string;
    category: string | null;
    county: string | null;
    signaturesCount: number;
    goal: number;
    status: string;
    createdAt: string;
  };
  collaboratingInstitutions: CollaboratingInstitution[];
}

export function OfficialPetitionFeed() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await apiGet<{ data: FeedItem[] }>('/officials/me/feed');
      setItems(result.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function advance(responseId: string, currentStage: string) {
    if (!isAuthenticated) return;
    const currentIndex = STAGES.indexOf(currentStage as (typeof STAGES)[number]);
    const nextStage = STAGES[currentIndex + 1];
    if (!nextStage) return;

    setAdvancing(responseId);
    try {
      await apiPost(`/officials/responses/${responseId}/advance`, { stage: nextStage });
      await load();
    } finally {
      setAdvancing(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading assigned petitions…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Assigned Issues</h2>
      {items.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">No petitions have been routed to your office yet.</p>
      )}
      {items.map((item) => {
        const currentIndex = STAGES.indexOf(item.currentStage as (typeof STAGES)[number]);
        const nextStage = STAGES[currentIndex + 1];
        return (
          <div key={item.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-white break-words">{item.petition.title}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400 break-words">{item.petition.summary}</p>
                <p className="mt-2 text-xs text-zinc-400 dark:text-neutral-500">
                  {item.petition.county ?? 'National'} · {item.petition.category ?? 'Uncategorized'} ·{' '}
                  {item.petition.signaturesCount.toLocaleString()} / {item.petition.goal.toLocaleString()} signatures
                </p>
                {item.collaboratingInstitutions.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    Also handled by {item.collaboratingInstitutions.map((c) => c.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  {item.currentStage.replaceAll('_', ' ')}
                </span>
                {nextStage && (
                  <button
                    type="button"
                    disabled={advancing === item.id}
                    onClick={() => advance(item.id, item.currentStage)}
                    className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {advancing === item.id ? 'Updating…' : `Advance to ${nextStage.replaceAll('_', ' ')}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
