'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { SiteFooter } from '../../components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface SponsorshipPackage {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  durationDays: number;
}

interface SponsorshipPurchase {
  id: string;
  packageId: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  package: SponsorshipPackage;
  endsAt: string | null;
}

function formatPrice(pkg: SponsorshipPackage): string {
  const amount = Number(pkg.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${pkg.currency} $${formatted}`;
}

const STATUS_LABEL: Record<SponsorshipPurchase['status'], string> = {
  PENDING: 'Payment processing',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export function SponsorshipsClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [packages, setPackages] = useState<SponsorshipPackage[]>([]);
  const [purchases, setPurchases] = useState<SponsorshipPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [packagesData, purchasesData] = await Promise.all([
        apiGet<SponsorshipPackage[]>('/sponsorships/packages'),
        isAuthenticated ? apiGet<SponsorshipPurchase[]>('/sponsorships/me') : Promise.resolve([]),
      ]);
      setPackages(packagesData);
      setPurchases(purchasesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsorship packages');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  async function handlePurchase(packageKey: string) {
    if (!isAuthenticated) return;
    setError(null);
    setPendingKey(packageKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        '/sponsorships/purchase',
        {
          packageKey,
          successUrl: `${origin}/sponsorships?checkout=success`,
          cancelUrl: `${origin}/sponsorships?checkout=cancelled`,
        },
      );
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPendingKey(null);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/marketplace" className="text-xs font-semibold uppercase tracking-widest text-emerald-600 hover:underline dark:text-emerald-400">
              ← Marketplace
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Become a sponsor
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Purchase a sponsorship package to help fund the platform. Once fulfilled, your organization is listed
              on our{' '}
              <Link href="/sponsors" className="underline hover:text-emerald-700 dark:hover:text-emerald-400">
                sponsors &amp; partners page
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {checkoutResult === 'success' && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              Thanks! Your payment is processing — we&apos;ll be in touch to fulfill your sponsorship listing.
            </div>
          )}
          {checkoutResult === 'cancelled' && (
            <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              Checkout was cancelled — no charge was made.
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          {purchases.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
                My sponsorships
              </h2>
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <Card key={purchase.id} rounded="2xl" className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{purchase.package.name}</p>
                      {purchase.endsAt && (
                        <p className="text-xs text-zinc-500 dark:text-neutral-400">
                          Ends {new Date(purchase.endsAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge>{STATUS_LABEL[purchase.status]}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
          ) : packages.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">
              No sponsorship packages are available right now — check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {packages.map((pkg) => (
                <Card key={pkg.id} rounded="2xl">
                  <CardHeader>
                    <CardTitle>{pkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pkg.description && (
                      <p className="text-sm text-zinc-600 dark:text-neutral-400">{pkg.description}</p>
                    )}
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(pkg)}</p>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400">{pkg.durationDays} days</p>
                    {!isAuthenticated ? (
                      <Link
                        href={`/auth/login?next=${encodeURIComponent('/sponsorships')}`}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                      >
                        Log in to purchase
                      </Link>
                    ) : (
                      <Button
                        isLoading={pendingKey === pkg.key}
                        loadingText="Starting checkout…"
                        disabled={pendingKey !== null && pendingKey !== pkg.key}
                        onClick={() => void handlePurchase(pkg.key)}
                      >
                        Purchase
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
