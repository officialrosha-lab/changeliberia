'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Promotion {
  id: string;
  petitionId: string;
  amount: string;
  currency: string;
  placement: 'FEATURED_HOME' | 'TRENDING_BOOST' | 'CATEGORY_TOP';
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startsAt: string | null;
  endsAt: string | null;
  petition: { id: string; title: string };
}

const PLACEMENT_LABEL: Record<Promotion['placement'], string> = {
  FEATURED_HOME: 'Featured on homepage',
  TRENDING_BOOST: 'Trending boost',
  CATEGORY_TOP: 'Top of category',
};

const STATUS_LABEL: Record<Promotion['status'], string> = {
  PENDING: 'Payment processing',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export function PromotionsClient() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<Promotion[]>('/petition-promotions/me', token);
      setPromotions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent('/promotions')}`);
      return;
    }
    void load();
  }, [hydrated, token, router, load]);

  if (!hydrated || !token) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500 dark:text-neutral-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My promotions</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
        Petitions you&apos;ve paid to promote.
      </p>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
      ) : promotions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-neutral-700 dark:text-neutral-400">
          You haven&apos;t promoted any petitions yet.{' '}
          <Link href="/petitions" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Browse petitions
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id} rounded="2xl" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/petitions/${promo.petitionId}`}
                    className="font-semibold text-zinc-900 hover:underline dark:text-white"
                  >
                    {promo.petition.title}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                    {PLACEMENT_LABEL[promo.placement]}
                  </p>
                  {promo.endsAt && (
                    <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">
                      Ends {new Date(promo.endsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge>{STATUS_LABEL[promo.status]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
