'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type Placement = 'FEATURED_HOME' | 'TRENDING_BOOST' | 'CATEGORY_TOP';
type PlacementStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

interface Promotion {
  id: string;
  petitionId: string;
  petition: { id: string; title: string };
  purchaserUserId: string;
  amount: string;
  currency: string;
  placement: Placement;
  status: PlacementStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const PLACEMENTS: Placement[] = ['FEATURED_HOME', 'TRENDING_BOOST', 'CATEGORY_TOP'];

const PLACEMENT_LABEL: Record<Placement, string> = {
  FEATURED_HOME: 'Featured on homepage',
  TRENDING_BOOST: 'Trending boost',
  CATEGORY_TOP: 'Top of category',
};

const STATUS_STYLES: Record<PlacementStatus, string> = {
  PENDING: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export function PetitionPromotionsPanel() {
  const token = useAuthStore((s) => s.token);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [pricing, setPricing] = useState<Record<Placement, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [promotionsData, pricingData] = await Promise.all([
        apiGet<Promotion[]>('/admin/petition-promotions', token),
        apiGet<Record<Placement, number>>('/admin/petition-promotions/pricing', token),
      ]);
      setPromotions(promotionsData);
      setPricing(pricingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load petition promotions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSavePricing() {
    if (!token || !pricing) return;
    setSavingPricing(true);
    setError(null);
    try {
      await apiPatch('/admin/petition-promotions/pricing', pricing, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing');
    } finally {
      setSavingPricing(false);
    }
  }

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading petition promotions…</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Placement pricing</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">
          There is no manual fulfillment step for promotions — a purchase activates automatically
          once Stripe confirms payment. This only controls what a buyer is charged per placement.
        </p>
        {pricing && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PLACEMENTS.map((placement) => (
              <label key={placement} className="block">
                <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">
                  {PLACEMENT_LABEL[placement]}
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm text-zinc-400">$</span>
                  <input
                    type="number"
                    min={0}
                    value={pricing[placement]}
                    onChange={(e) =>
                      setPricing({ ...pricing, [placement]: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </label>
            ))}
          </div>
        )}
        <button
          disabled={savingPricing}
          onClick={() => void handleSavePricing()}
          className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {savingPricing ? 'Saving…' : 'Save pricing'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Petition</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Placement</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Amount</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Window</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id} className="border-b border-zinc-200 dark:border-neutral-800">
                <td className="px-4 py-3 font-medium dark:text-neutral-100">
                  <Link
                    href={`/petitions/${promo.petitionId}`}
                    target="_blank"
                    className="hover:underline"
                  >
                    {promo.petition.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-neutral-300">
                  {PLACEMENT_LABEL[promo.placement]}
                </td>
                <td className="px-4 py-3 dark:text-neutral-300">
                  {promo.currency} {promo.amount}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${STATUS_STYLES[promo.status]}`}>
                    {promo.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">
                  {promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : '—'}
                  {promo.endsAt ? ` – ${new Date(promo.endsAt).toLocaleDateString()}` : ''}
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  No petition promotions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
