'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { SiteFooter } from '../../components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface ApiPlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  requestsPerDay: number;
}

interface ApiSubscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodEnd: string | null;
  plan: ApiPlan;
}

interface ApiKey {
  id: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED';
  lastUsedAt: string | null;
  createdAt: string;
}

const INTERVAL_LABEL: Record<ApiPlan['interval'], string> = {
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  YEARLY: '/year',
};

function formatPrice(plan: ApiPlan): string {
  const amount = Number(plan.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${plan.currency} $${formatted}${INTERVAL_LABEL[plan.interval]}`;
}

export function DevelopersClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, meData, keysData] = await Promise.all([
        apiGet<ApiPlan[]>('/api-billing/plans'),
        isAuthenticated
          ? apiGet<{ subscription: ApiSubscription | null }>('/api-billing/me')
          : Promise.resolve({ subscription: null }),
        isAuthenticated ? apiGet<ApiKey[]>('/api-billing/keys') : Promise.resolve([]),
      ]);
      setPlans(plansData);
      setSubscription(meData.subscription);
      setKeys(keysData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API billing info');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  async function handleSubscribe(planKey: string) {
    if (!isAuthenticated) return;
    setError(null);
    setPendingKey(planKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        '/api-billing/subscribe',
        {
          planKey,
          successUrl: `${origin}/developers?checkout=success`,
          cancelUrl: `${origin}/developers?checkout=cancelled`,
        },
      );
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPendingKey(null);
    }
  }

  async function handleCancel() {
    if (!isAuthenticated) return;
    setError(null);
    setCancelling(true);
    try {
      await apiPost('/api-billing/cancel', {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  async function handleCreateKey() {
    if (!isAuthenticated) return;
    setError(null);
    setCreatingKey(true);
    try {
      const res = await apiPost<{ id: string; keyPrefix: string; rawKey: string }>(
        '/api-billing/keys',
        {},
      );
      setNewRawKey(res.rawKey);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!isAuthenticated) return;
    setError(null);
    setRevokingKeyId(keyId);
    try {
      await apiDelete(`/api-billing/keys/${keyId}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevokingKeyId(null);
    }
  }

  const isActive = subscription?.status === 'ACTIVE';

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/marketplace" className="text-xs font-semibold uppercase tracking-widest text-emerald-600 hover:underline dark:text-emerald-400">
              ← Marketplace
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              API access
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Programmatic access to platform data for newsrooms, researchers, and civic-tech developers.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {checkoutResult === 'success' && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              Thanks! Your payment is processing — your subscription will activate once it&apos;s confirmed.
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
          ) : (
            <>
              {subscription ? (
                <Card rounded="2xl" className="mb-10">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{subscription.plan.name}</CardTitle>
                      <Badge>{subscription.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-neutral-400">
                      {subscription.plan.requestsPerDay.toLocaleString()} requests/day
                      {subscription.currentPeriodEnd &&
                        ` — renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                    </p>
                    {subscription.status !== 'CANCELLED' && (
                      <Button variant="secondary" isLoading={cancelling} loadingText="Cancelling…" onClick={() => void handleCancel()}>
                        Cancel subscription
                      </Button>
                    )}

                    {isActive && (
                      <div className="border-t border-zinc-200 pt-4 dark:border-neutral-700">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">API keys</h3>

                        {newRawKey && (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                            <p className="font-semibold text-amber-800 dark:text-amber-300">
                              Copy this key now — it won&apos;t be shown again.
                            </p>
                            <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 text-xs text-zinc-900 dark:bg-neutral-900 dark:text-neutral-100">
                              {newRawKey}
                            </code>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                void navigator.clipboard.writeText(newRawKey);
                                setNewRawKey(null);
                              }}
                            >
                              Copy &amp; dismiss
                            </Button>
                          </div>
                        )}

                        <div className="mt-3 space-y-2">
                          {keys.map((key) => (
                            <div
                              key={key.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-neutral-700"
                            >
                              <div>
                                <code className="text-zinc-700 dark:text-neutral-300">{key.keyPrefix}…</code>
                                <span className="ml-2">
                                  <Badge variant={key.status === 'ACTIVE' ? 'default' : 'outline'}>{key.status}</Badge>
                                </span>
                              </div>
                              {key.status === 'ACTIVE' && (
                                <button
                                  disabled={revokingKeyId === key.id}
                                  onClick={() => void handleRevokeKey(key.id)}
                                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className="mt-3"
                          isLoading={creatingKey}
                          loadingText="Generating…"
                          onClick={() => void handleCreateKey()}
                        >
                          Generate new key
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : plans.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">
                  No API plans are available right now.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {plans.map((plan) => (
                    <Card key={plan.id} rounded="2xl">
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {plan.description && (
                          <p className="text-sm text-zinc-600 dark:text-neutral-400">{plan.description}</p>
                        )}
                        <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(plan)}</p>
                        <p className="text-xs text-zinc-500 dark:text-neutral-400">
                          {plan.requestsPerDay.toLocaleString()} requests/day
                        </p>
                        {!isAuthenticated ? (
                          <Link
                            href={`/auth/login?next=${encodeURIComponent('/developers')}`}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                          >
                            Log in to subscribe
                          </Link>
                        ) : (
                          <Button
                            isLoading={pendingKey === plan.key}
                            loadingText="Starting checkout…"
                            disabled={pendingKey !== null && pendingKey !== plan.key}
                            onClick={() => void handleSubscribe(plan.key)}
                          >
                            Subscribe
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
