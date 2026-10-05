'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type SubscriptionProductType = 'MEMBERSHIP' | 'ORGANIZATION' | 'INSTITUTION' | 'API';

interface UnifiedSubscriptionRow {
  productType: SubscriptionProductType;
  id: string;
  status: string;
  planKey: string;
  planName: string;
  subject: string;
  createdAt: string;
  currentPeriodEnd: string | null;
}

const PRODUCT_LABELS: Record<SubscriptionProductType, string> = {
  MEMBERSHIP: 'Membership',
  ORGANIZATION: 'Organization',
  INSTITUTION: 'Institution',
  API: 'API',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300',
  PAST_DUE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  PENDING: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export function SubscriptionsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [rows, setRows] = useState<UnifiedSubscriptionRow[]>([]);
  const [productFilter, setProductFilter] = useState<SubscriptionProductType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiGet<UnifiedSubscriptionRow[]>('/admin/monetization/subscriptions')
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading subscriptions…</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  const visible = productFilter === 'ALL' ? rows : rows.filter((r) => r.productType === productFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'MEMBERSHIP', 'ORGANIZATION', 'INSTITUTION', 'API'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProductFilter(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              productFilter === p
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {p === 'ALL' ? 'All' : PRODUCT_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Product</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Subject</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Plan</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Since</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Renews / ended</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={`${row.productType}-${row.id}`} className="border-b border-zinc-200 dark:border-neutral-800">
                <td className="px-4 py-3 dark:text-neutral-300">{PRODUCT_LABELS[row.productType]}</td>
                <td className="px-4 py-3 font-medium dark:text-neutral-100">{row.subject}</td>
                <td className="px-4 py-3 dark:text-neutral-300">{row.planName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${STATUS_STYLES[row.status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400'}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">
                  {row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  No subscriptions here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
