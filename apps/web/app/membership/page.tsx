'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface MembershipPlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

interface MembershipSubscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodEnd: string | null;
  plan: MembershipPlan;
}

const INTERVAL_LABEL: Record<MembershipPlan['interval'], string> = {
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  YEARLY: '/year',
};

function formatPrice(plan: MembershipPlan): string {
  const amount = Number(plan.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${plan.currency} $${formatted}${INTERVAL_LABEL[plan.interval]}`;
}

export default function MembershipPage() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanKey, setPendingPlanKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, subscriptionData] = await Promise.all([
        apiGet<MembershipPlan[]>('/memberships/plans'),
        token
          ? apiGet<{ subscription: MembershipSubscription | null }>('/memberships/me', token)
          : Promise.resolve({ subscription: null }),
      ]);
      setPlans(plansData);
      setMySubscription(subscriptionData.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    loadData();
  }, [hydrated, loadData]);

  async function handleSubscribe(planKey: string) {
    if (!token) {
      window.location.href = '/auth/login?next=%2Fmembership';
      return;
    }
    setError(null);
    setPendingPlanKey(planKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        '/memberships/subscribe',
        {
          planKey,
          successUrl: `${origin}/membership?checkout=success`,
          cancelUrl: `${origin}/membership?checkout=cancelled`,
        },
        token,
      );
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPendingPlanKey(null);
    }
  }

  async function handleCancel() {
    if (!token) return;
    setError(null);
    setCancelling(true);
    try {
      await apiPost('/memberships/cancel', {}, token);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel membership');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Home
        </Link>
        <span className="text-zinc-300 dark:text-neutral-600">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-white">Membership</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Membership</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
        Supporting members help fund the platform and get access to optional extras. This never
        changes what&apos;s free.
      </p>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        Creating, signing, and following petitions is free forever — so is Civic Pulse, and a
        verified lawmaker&apos;s basic constituency access. Membership only unlocks optional
        extras; it never affects signature counts, poll results, or a petition&apos;s legitimacy.
      </div>

      {checkoutResult === 'success' && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          Thanks! Your payment is processing — this page will update once it&apos;s confirmed.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 py-8 text-center text-sm text-zinc-500 dark:text-neutral-400">
          Loading…
        </div>
      ) : mySubscription ? (
        <Card rounded="2xl" className="mt-8">
          <CardHeader>
            <CardTitle>{mySubscription.plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-neutral-400">
              Status: <span className="font-semibold">{mySubscription.status}</span>
              {mySubscription.currentPeriodEnd &&
                ` — renews ${new Date(mySubscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
            {mySubscription.status !== 'CANCELLED' && (
              <Button
                variant="secondary"
                isLoading={cancelling}
                loadingText="Cancelling…"
                onClick={handleCancel}
              >
                Cancel membership
              </Button>
            )}
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <div className="mt-10 py-8 text-center text-sm text-zinc-500 dark:text-neutral-400">
          Membership isn&apos;t available right now. Check back soon.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} rounded="2xl">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-zinc-600 dark:text-neutral-400">
                    {plan.description}
                  </p>
                )}
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {formatPrice(plan)}
                </p>
                <Button
                  isLoading={pendingPlanKey === plan.key}
                  loadingText="Starting checkout…"
                  disabled={pendingPlanKey !== null && pendingPlanKey !== plan.key}
                  onClick={() => handleSubscribe(plan.key)}
                >
                  Become a member
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
