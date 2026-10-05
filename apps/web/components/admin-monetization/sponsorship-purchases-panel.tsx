'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type PlacementStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

interface Sponsor {
  id: string;
  name: string;
}

interface Purchase {
  id: string;
  status: PlacementStatus;
  package: { id: string; name: string; priceAmount: string; currency: string };
  purchaser: { id: string; fullName: string; email: string | null };
  sponsor: Sponsor | null;
  endsAt: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<PlacementStatus, string> = {
  PENDING: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export function SponsorshipPurchasesPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [creatingSponsor, setCreatingSponsor] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLogoUrl, setNewSponsorLogoUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [purchasesData, sponsorsData] = await Promise.all([
        apiGet<Purchase[]>('/admin/sponsorships/purchases'),
        apiGet<Sponsor[]>('/admin/sponsors'),
      ]);
      setPurchases(purchasesData);
      setSponsors(sponsorsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsorship purchases');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  function startFulfill(purchaseId: string) {
    setFulfillingId(purchaseId);
    setSelectedSponsorId('');
    setCreatingSponsor(false);
    setNewSponsorName('');
    setNewSponsorLogoUrl('');
  }

  async function handleFulfill(purchaseId: string) {
    if (!isAuthenticated) return;
    setBusy(true);
    setError(null);
    try {
      let sponsorId = selectedSponsorId;
      if (creatingSponsor) {
        if (!newSponsorName.trim() || !newSponsorLogoUrl.trim()) {
          setError('A new sponsor needs both a name and a logo URL');
          setBusy(false);
          return;
        }
        const sponsor = await apiPost<Sponsor>(
          '/admin/sponsors',
          { name: newSponsorName.trim(), logoUrl: newSponsorLogoUrl.trim(), type: 'sponsor' },
        );
        sponsorId = sponsor.id;
      }
      if (!sponsorId) {
        setError('Choose an existing sponsor or create a new one');
        setBusy(false);
        return;
      }
      await apiPost(`/admin/sponsorships/purchases/${purchaseId}/fulfill`, { sponsorId });
      setFulfillingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fulfill purchase');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading sponsorship purchases…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Package</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Purchaser</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Sponsor listing</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-zinc-200 dark:border-neutral-800">
                <td className="px-4 py-3 font-medium dark:text-neutral-100">{purchase.package.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-neutral-300">
                  {purchase.purchaser.fullName}
                  {purchase.purchaser.email && (
                    <span className="block text-xs text-zinc-400 dark:text-neutral-500">
                      {purchase.purchaser.email}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${STATUS_STYLES[purchase.status]}`}>
                    {purchase.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-neutral-300">
                  {purchase.sponsor ? purchase.sponsor.name : '—'}
                </td>
                <td className="px-4 py-3">
                  {purchase.sponsor ? (
                    <span className="text-zinc-400 dark:text-neutral-500">Fulfilled</span>
                  ) : purchase.status === 'PENDING' ? (
                    <span className="text-zinc-400 dark:text-neutral-500">Awaiting payment</span>
                  ) : (
                    <button
                      onClick={() => startFulfill(purchase.id)}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Fulfill
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  No sponsorship purchases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {fulfillingId && (
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Link a sponsor listing</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">
            Choose an existing logo-wall entry, or create a new one for this sponsorship.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCreatingSponsor(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                !creatingSponsor
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              Existing sponsor
            </button>
            <button
              onClick={() => setCreatingSponsor(true)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                creatingSponsor
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              New sponsor
            </button>
          </div>

          {creatingSponsor ? (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Sponsor name"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
              <input
                type="text"
                placeholder="Logo URL"
                value={newSponsorLogoUrl}
                onChange={(e) => setNewSponsorLogoUrl(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          ) : (
            <select
              value={selectedSponsorId}
              onChange={(e) => setSelectedSponsorId(e.target.value)}
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">Select a sponsor…</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="mt-4 flex gap-2">
            <button
              disabled={busy}
              onClick={() => void handleFulfill(fulfillingId)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {busy ? 'Linking…' : 'Fulfill purchase'}
            </button>
            <button
              onClick={() => setFulfillingId(null)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
