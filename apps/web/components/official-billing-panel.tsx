'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface WorkspacePlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceAmount: string;
  currency: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  seatLimit: number | null;
}

type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

interface InstitutionSubscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  plan: WorkspacePlan;
}

interface InstitutionMe {
  id: string;
  holderUserId: string | null;
}

const INTERVAL_LABEL: Record<WorkspacePlan['interval'], string> = {
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  YEARLY: '/year',
};

function formatPrice(plan: WorkspacePlan): string {
  const amount = Number(plan.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${plan.currency} $${formatted}${INTERVAL_LABEL[plan.interval]}`;
}

export function OfficialBillingPanel({ checkoutResult }: { checkoutResult?: string | null }) {
  const token = useAuthStore((s) => s.token);

  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [isOfficeholder, setIsOfficeholder] = useState(false);
  const [subscription, setSubscription] = useState<InstitutionSubscription | null>(null);
  const [plans, setPlans] = useState<WorkspacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanKey, setPendingPlanKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [me, myUser] = await Promise.all([
        apiGet<InstitutionMe>('/officials/me', token),
        apiGet<{ id: string }>('/users/me', token),
      ]);
      setInstitutionId(me.id);
      setIsOfficeholder(me.holderUserId === myUser.id);

      const [subData, plansData] = await Promise.all([
        apiGet<{ subscription: InstitutionSubscription | null }>(
          `/institutions/${me.id}/subscription`,
          token,
        ),
        apiGet<WorkspacePlan[]>('/workspace-plans?scope=INSTITUTION'),
      ]);
      setSubscription(subData.subscription);
      setPlans(plansData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubscribe(planKey: string) {
    if (!token || !institutionId) return;
    setError(null);
    setPendingPlanKey(planKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        `/institutions/${institutionId}/subscribe`,
        {
          planKey,
          successUrl: `${origin}/official/dashboard?tab=billing&checkout=success`,
          cancelUrl: `${origin}/official/dashboard?tab=billing&checkout=cancelled`,
        },
        token,
      );
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPendingPlanKey(null);
    }
  }

  async function handleCancel() {
    if (!token || !institutionId) return;
    setError(null);
    setCancelling(true);
    try {
      await apiPost(`/institutions/${institutionId}/cancel`, {}, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Workspace billing</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Optional advanced tooling for this office. Your basic constituency data, reports, and
          notifications stay free forever — no matter what.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          Thanks! Your payment is processing — this page will update once it&apos;s confirmed.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
      ) : subscription ? (
        <Card rounded="2xl">
          <CardHeader>
            <CardTitle>{subscription.plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-neutral-400">
              Status: <span className="font-semibold">{subscription.status}</span>
              {subscription.currentPeriodEnd &&
                ` — renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
            {isOfficeholder && subscription.status !== 'CANCELLED' && (
              <Button
                variant="secondary"
                isLoading={cancelling}
                loadingText="Cancelling…"
                onClick={() => void handleCancel()}
              >
                Cancel workspace plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-neutral-700 dark:text-neutral-400">
          Paid workspace plans aren&apos;t available right now.
        </div>
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
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {formatPrice(plan)}
                </p>
                {isOfficeholder ? (
                  <Button
                    isLoading={pendingPlanKey === plan.key}
                    loadingText="Starting checkout…"
                    disabled={pendingPlanKey !== null && pendingPlanKey !== plan.key}
                    onClick={() => void handleSubscribe(plan.key)}
                  >
                    Subscribe
                  </Button>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-neutral-500">
                    Only the officeholder can manage this institution&apos;s plan.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
