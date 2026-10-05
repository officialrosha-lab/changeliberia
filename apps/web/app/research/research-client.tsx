'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { SiteFooter } from '../../components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface ResearchProduct {
  id: string;
  key: string;
  title: string;
  description: string | null;
  priceAmount: string;
  currency: string;
}

interface ResearchProductPurchase {
  id: string;
  productId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  product: ResearchProduct;
  createdAt: string;
}

function formatPrice(product: ResearchProduct): string {
  const amount = Number(product.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${product.currency} $${formatted}`;
}

export function ResearchClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [products, setProducts] = useState<ResearchProduct[]>([]);
  const [purchases, setPurchases] = useState<ResearchProductPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, purchasesData] = await Promise.all([
        apiGet<ResearchProduct[]>('/research-products'),
        isAuthenticated ? apiGet<ResearchProductPurchase[]>('/research-products/me') : Promise.resolve([]),
      ]);
      setProducts(productsData);
      setPurchases(purchasesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load research products');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const purchaseByProductId = new Map(purchases.map((p) => [p.productId, p]));

  async function handlePurchase(productKey: string) {
    if (!isAuthenticated) return;
    setError(null);
    setPendingKey(productKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        '/research-products/purchase',
        {
          productKey,
          successUrl: `${origin}/research?checkout=success`,
          cancelUrl: `${origin}/research?checkout=cancelled`,
        },
      );
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPendingKey(null);
    }
  }

  async function handleDownload(productId: string) {
    if (!isAuthenticated) return;
    setError(null);
    setDownloadingId(productId);
    try {
      const res = await apiGet<{ url: string }>(`/research-products/${productId}/download`);
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download link');
    } finally {
      setDownloadingId(null);
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
              Research products
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Reports and datasets built from platform-wide petition and civic engagement trends across Liberia.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {checkoutResult === 'success' && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              Thanks! Your payment is processing — your purchase will appear below once it&apos;s confirmed.
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

          {loading ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">
              No research products are available right now — check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const purchase = purchaseByProductId.get(product.id);
                return (
                  <Card key={product.id} rounded="2xl">
                    <CardHeader>
                      <CardTitle>{product.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.description && (
                        <p className="text-sm text-zinc-600 dark:text-neutral-400">{product.description}</p>
                      )}
                      <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(product)}</p>

                      {purchase?.status === 'COMPLETED' ? (
                        <Button
                          isLoading={downloadingId === product.id}
                          loadingText="Preparing…"
                          onClick={() => void handleDownload(product.id)}
                        >
                          Download
                        </Button>
                      ) : purchase?.status === 'PENDING' ? (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Payment processing…
                        </p>
                      ) : !isAuthenticated ? (
                        <Link
                          href={`/auth/login?next=${encodeURIComponent('/research')}`}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                        >
                          Log in to purchase
                        </Link>
                      ) : (
                        <Button
                          isLoading={pendingKey === product.key}
                          loadingText="Starting checkout…"
                          disabled={pendingKey !== null && pendingKey !== product.key}
                          onClick={() => void handlePurchase(product.key)}
                        >
                          Purchase
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
