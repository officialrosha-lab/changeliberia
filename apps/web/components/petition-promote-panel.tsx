'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { Card } from './ui/card';
import { Button } from './ui/button';

type Placement = 'FEATURED_HOME' | 'TRENDING_BOOST' | 'CATEGORY_TOP';

const PLACEMENTS: { key: Placement; label: string; description: string }[] = [
  { key: 'FEATURED_HOME', label: 'Featured on homepage', description: 'Shown in the marketplace featured strip' },
  { key: 'TRENDING_BOOST', label: 'Trending boost', description: 'Prioritized in trending/discovery surfaces' },
  { key: 'CATEGORY_TOP', label: 'Top of category', description: 'Pinned near the top of its category listing' },
];

export function PetitionPromotePanel({ petitionId }: { petitionId: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pending, setPending] = useState<Placement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promotionsEnabled, setPromotionsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ promotionsEnabled: boolean }>('/settings/system')
      .then((settings) => {
        if (cancelled) return;
        setPromotionsEnabled(settings.promotionsEnabled);
      })
      .catch(() => {/* default stays off — never show a checkout button we can't confirm is live */})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePromote(placement: Placement) {
    if (!isAuthenticated) return;
    setError(null);
    setPending(placement);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        `/petitions/${petitionId}/promote`,
        {
          placement,
          successUrl: `${origin}/petitions/${petitionId}?checkout=success`,
          cancelUrl: `${origin}/petitions/${petitionId}?checkout=cancelled`,
        },
      );
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPending(null);
    }
  }

  if (loading || !promotionsEnabled) return null;

  return (
    <Card rounded="3xl" className="p-6 shadow-sm md:p-8">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-neutral-50">Promote this petition</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
        Pay to boost visibility — this never changes the signature count or how the government must respond. See
        exact pricing at checkout.
      </p>
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {PLACEMENTS.map((p) => (
          <div
            key={p.key}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700"
          >
            <div>
              <p className="font-semibold text-zinc-900 dark:text-neutral-100">{p.label}</p>
              <p className="text-sm text-zinc-500 dark:text-neutral-400">{p.description}</p>
            </div>
            {!isAuthenticated ? (
              <Link
                href={`/auth/login?next=${encodeURIComponent(`/petitions/${petitionId}`)}`}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Log in to promote
              </Link>
            ) : (
              <Button
                size="sm"
                isLoading={pending === p.key}
                loadingText="Starting checkout…"
                disabled={pending !== null && pending !== p.key}
                onClick={() => void handlePromote(p.key)}
              >
                Choose
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
