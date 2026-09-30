'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';

type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';
type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

const MANAGE_ROLES: OrgRole[] = ['OWNER', 'ADMIN'];
// Mirrors OrganizationsService.FREE_SEAT_LIMIT (apps/api/src/organizations/organizations.service.ts)
// — not exposed via the API, so kept in sync here as a display-only constant.
const FREE_SEAT_LIMIT = 5;

const ROLE_LABEL: Record<OrgRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' };
const INTERVAL_LABEL: Record<WorkspacePlan['interval'], string> = {
  MONTHLY: '/month',
  QUARTERLY: '/quarter',
  YEARLY: '/year',
};

interface Member {
  userId: string;
  role: OrgRole;
  user: { id: string; fullName: string; email: string | null };
}

interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberships: Member[];
}

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

interface OrgSubscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  plan: WorkspacePlan;
}

function formatPrice(plan: WorkspacePlan): string {
  const amount = Number(plan.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${plan.currency} $${formatted}${INTERVAL_LABEL[plan.interval]}`;
}

export function OrganizationDetailClient({ organizationId }: { organizationId: string }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [subscription, setSubscription] = useState<OrgSubscription | null>(null);
  const [plans, setPlans] = useState<WorkspacePlan[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'billing'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Extract<OrgRole, 'MEMBER' | 'ADMIN'>>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [memberActionUserId, setMemberActionUserId] = useState<string | null>(null);

  const [pendingPlanKey, setPendingPlanKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/organizations/${organizationId}`)}`);
    }
  }, [hydrated, token, router, organizationId]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [me, orgData, subData, plansData] = await Promise.all([
        apiGet<{ id: string }>('/users/me', token),
        apiGet<OrganizationDetail>(`/organizations/${organizationId}`, token),
        apiGet<{ subscription: OrgSubscription | null }>(
          `/organizations/${organizationId}/subscription`,
          token,
        ),
        apiGet<WorkspacePlan[]>('/workspace-plans?scope=ORGANIZATION'),
      ]);
      setMyUserId(me.id);
      setOrg(orgData);
      setSubscription(subData.subscription);
      setPlans(plansData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [token, organizationId]);

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token, load]);

  const myMembership = org?.memberships.find((m) => m.userId === myUserId) ?? null;
  const canManage = myMembership ? MANAGE_ROLES.includes(myMembership.role) : false;
  const isOwner = myMembership?.role === 'OWNER';
  // The seat limit a paid plan raises only takes effect once the subscription
  // is actually ACTIVE — a PENDING or PAST_DUE row still leaves the org on
  // the free tier, matching OrganizationsService.currentSeatLimit exactly.
  const seatLimit =
    subscription?.status === 'ACTIVE' ? subscription.plan.seatLimit : FREE_SEAT_LIMIT;
  const memberCount = org?.memberships.length ?? 0;

  async function handleInvite() {
    if (!token || !inviteEmail.trim()) return;
    setError(null);
    setInviting(true);
    try {
      await apiPost(
        `/organizations/${organizationId}/members`,
        { email: inviteEmail.trim(), role: inviteRole },
        token,
      );
      setInviteEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(targetUserId: string) {
    if (!token) return;
    setError(null);
    setMemberActionUserId(targetUserId);
    try {
      await apiDelete(`/organizations/${organizationId}/members/${targetUserId}`, token);
      if (targetUserId === myUserId) {
        router.push('/organizations');
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setMemberActionUserId(null);
    }
  }

  async function handleRoleChange(targetUserId: string, role: OrgRole) {
    if (!token) return;
    setError(null);
    setMemberActionUserId(targetUserId);
    try {
      await apiPatch(`/organizations/${organizationId}/members/${targetUserId}`, { role }, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setMemberActionUserId(null);
    }
  }

  async function handleSubscribe(planKey: string) {
    if (!token) return;
    setError(null);
    setPendingPlanKey(planKey);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        `/organizations/${organizationId}/subscribe`,
        {
          planKey,
          successUrl: `${origin}/organizations/${organizationId}?checkout=success`,
          cancelUrl: `${origin}/organizations/${organizationId}?checkout=cancelled`,
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
      await apiPost(`/organizations/${organizationId}/cancel`, {}, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  if (!hydrated || !token || (loading && !org)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-zinc-500 dark:text-neutral-400">
        Loading…
      </main>
    );
  }

  if (!org) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error ?? 'Organization not found.'}</p>
        <Link href="/organizations" className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline dark:text-emerald-400">
          Back to my organizations
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/organizations"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Organizations
        </Link>
        <span className="text-zinc-300 dark:text-neutral-600">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-white">{org.name}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{org.name}</h1>
        {myMembership && <Badge>{ROLE_LABEL[myMembership.role]}</Badge>}
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">/{org.slug}</p>

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

      <div className="mt-6 flex gap-2 border-b border-zinc-200 dark:border-neutral-700">
        {(['overview', 'members', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card rounded="2xl">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Members</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                {memberCount}
                <span className="text-sm font-normal text-zinc-500 dark:text-neutral-400">
                  {' '}
                  / {seatLimit ?? '∞'}
                </span>
              </p>
            </CardContent>
          </Card>
          <Card rounded="2xl">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Workspace plan</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                {subscription ? subscription.plan.name : 'Free'}
              </p>
              {subscription && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">{subscription.status}</p>
              )}
            </CardContent>
          </Card>
          <Card rounded="2xl">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Created</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                {new Date(org.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="mt-6 space-y-6">
          {canManage && (
            <Card rounded="2xl">
              <CardHeader>
                <CardTitle>Invite a member</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  className="w-full sm:w-auto"
                  type="email"
                  placeholder="Email of an existing Change Liberia account"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <Button
                  isLoading={inviting}
                  loadingText="Adding…"
                  disabled={!inviteEmail.trim()}
                  onClick={() => void handleInvite()}
                >
                  Add
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold dark:text-white">Name</th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-white">Email</th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-white">Role</th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {org.memberships.map((member) => {
                  const isSelf = member.userId === myUserId;
                  const busy = memberActionUserId === member.userId;
                  return (
                    <tr key={member.userId} className="border-b border-zinc-200 last:border-0 dark:border-neutral-800">
                      <td className="px-4 py-3 font-medium dark:text-neutral-100">
                        {member.user.fullName}
                        {isSelf && <span className="ml-2 text-xs font-normal text-zinc-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">{member.user.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        {isOwner ? (
                          <select
                            value={member.role}
                            disabled={busy}
                            onChange={(e) => void handleRoleChange(member.userId, e.target.value as OrgRole)}
                            className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                          </select>
                        ) : (
                          <Badge>{ROLE_LABEL[member.role]}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(canManage || isSelf) && (
                          <button
                            disabled={busy}
                            onClick={() => void handleRemove(member.userId)}
                            className="font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                          >
                            {isSelf ? 'Leave' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="mt-6 space-y-6">
          {subscription ? (
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
                {canManage && subscription.status !== 'CANCELLED' && (
                  <Button variant="secondary" isLoading={cancelling} loadingText="Cancelling…" onClick={() => void handleCancel()}>
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
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(plan)}</p>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400">
                      {plan.seatLimit === null ? 'Unlimited seats' : `Up to ${plan.seatLimit} seats`}
                    </p>
                    {canManage ? (
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
                        Only an owner or admin can subscribe.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
