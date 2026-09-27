'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminFraudPanel } from '../../components/admin-fraud-panel';
import { AdminIdDocsPanel } from '../../components/admin-id-docs-panel';
import { AdminGovernmentPanel } from '../../components/admin-government-panel';
import { AdminOfficialsVerificationPanel } from '../../components/admin-officials-verification-panel';
import { AdminGeographicInsights } from '../../components/admin-geographic-insights';
import { AdminEndorsementsPanel } from '../../components/admin-endorsements-panel';
import { AdminPendingPetitionsPanel } from '../../components/admin-pending-petitions-panel';
import { AdminPendingPollsPanel } from '../../components/admin-pending-polls-panel';
import { AdminDeletePetitionPanel } from '../../components/admin-delete-petition-panel';
import { AdminUserManager } from '../../components/admin-users';
import { GlobalAnalytics } from '../../components/admin-analytics';
import { AdminSettings } from '../../components/admin-settings';
import { CMSPageManager, CMSTemplateManager } from '../../components/cms';
import { CMSPageBlockEditor } from '../../components/cms-page-block-editor';
import { AdminStripeDashboard } from '../../components/admin-stripe-dashboard';
import { AdminStripePayments } from '../../components/admin-stripe-payments';
import { AdminStripeSubscriptions } from '../../components/admin-stripe-subscriptions';
import { AdminStripeRefunds } from '../../components/admin-stripe-refunds';
import { AdminStripeAnalytics } from '../../components/admin-stripe-analytics';
import { AdminFacebookDashboard } from '../../components/admin-facebook-dashboard';
import { AdminFacebookPixel } from '../../components/admin-facebook-pixel';
import { AdminFacebookReach } from '../../components/admin-facebook-reach';
import { AdminFacebookSocialFeatures } from '../../components/admin-facebook-social-features';
import { AdminFacebookEngagement } from '../../components/admin-facebook-engagement';
import { AdminEmailSettings } from '../../components/admin-email-settings';
import { AdminSocialMediaDashboard } from '../../components/admin-social-media-dashboard';
import { AdminActivityLog } from '../../components/admin-activity-log';
import { AdminPollCreationPanel } from '../../components/admin-poll-creation-panel';
import { ErrorBoundary } from '../../components/error-boundary';
import { Card } from '../../components/ui/card';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type FraudEvent = { id: string; details: string; createdAt: string };
type FraudRule = {
  id: string;
  key: string;
  description: string;
  threshold: number;
  penalty: number;
  enabled: boolean;
};
type FraudSnapshot = {
  id: string;
  riskIndex: number;
  suspiciousSignatures: number;
  totalSignatures: number;
  createdAt: string;
};
type FraudAnalytics = {
  latestSnapshots: FraudSnapshot[];
  topRules: Array<{ ruleKey: string; count: number }>;
};

type PendingIdDoc = {
  id: string;
  type: string;
  fileUrl: string;
  user: { fullName: string; phone: string };
};

type Me = { role: string };

export function AdminPageClient() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'users' | 'analytics' | 'government' | 'officials' | 'geography' | 'endorsements' | 'cms' | 'settings' | 'ambassadors' | 'payments' | 'integrations' | 'email' | 'social-media' | 'activity-log' | 'polls'>('dashboard');
  const [phase, setPhase] = useState<'loading' | 'denied' | 'ok'>('loading');
  const [pending, setPending] = useState<{ id: string; title: string; category?: string | null; summary: string }[]>([]);
  const [pendingPolls, setPendingPolls] = useState<{ id: string; slug: string; title: string; description?: string | null; category: string; county?: string | null; createdAt: string; creatorName: string; creatorEmail: string }[]>([]);
  const [pendingIds, setPendingIds] = useState<PendingIdDoc[]>([]);
  const [flags, setFlags] = useState<FraudEvent[]>([]);
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics>({
    latestSnapshots: [],
    topRules: [],
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setPhase('denied');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<Me>('/users/me', token);
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          setPhase('denied');
          return;
        }
        const [p, polls, ids, f, r, a] = await Promise.all([
          apiGet<{ id: string; title: string; category?: string | null; summary: string }[]>('/admin/petitions/pending', token),
          apiGet<{ id: string; slug: string; title: string; description?: string | null; category: string; county?: string | null; createdAt: string; creator: { fullName: string; email: string } }[]>('/admin/polls/pending', token),
          apiGet<PendingIdDoc[]>('/admin/id-documents/pending', token),
          apiGet<FraudEvent[]>('/admin/fraud/flags', token),
          apiGet<FraudRule[]>('/fraud/rules', token),
          apiGet<FraudAnalytics>('/fraud/analytics', token),
        ]);
        if (cancelled) return;
        setPending(p);
        setPendingPolls(polls.map(poll => ({
          ...poll,
          creatorName: poll.creator.fullName,
          creatorEmail: poll.creator.email,
        })));
        setPendingIds(ids);
        setFlags(f);
        setRules(r);
        setAnalytics(a);
        setPhase('ok');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, hydrated]);

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-4 text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-4 text-zinc-600">
          <Link href="/auth/login" className="font-semibold text-emerald-700 underline">
            Sign in
          </Link>{' '}
          with an admin account to continue.
        </p>
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-4 text-zinc-600">
          Your account does not have admin access. If you are a moderator, sign in with an admin user
          or contact the platform operator.
        </p>
        <p className="mt-4">
          <Link href="/dashboard" className="text-emerald-700 underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-4 text-zinc-600">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-neutral-50">Admin Panel</h1>
        <Link href="/dashboard" className="text-emerald-600 hover:underline text-sm font-medium dark:text-emerald-400">
          Back to Dashboard
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="-mx-4 mb-6 overflow-x-auto border-b border-zinc-200 px-4 dark:border-neutral-800">
        <div className="flex gap-1 sm:gap-2">
          {(
            [
              ['dashboard', 'Dashboard'],
              ['directory', 'Directory'],
              ['polls', 'Pending Polls'],
              ['users', 'Users'],
              ['analytics', 'Analytics'],
              ['government', 'Government'],
              ['officials', 'Officials'],
              ['geography', 'Geography'],
              ['endorsements', 'Endorsements'],
              ['payments', 'Payments'],
              ['integrations', 'Integrations'],
              ['ambassadors', 'Ambassadors'],
              ['social-media', 'Social Media'],
              ['activity-log', 'Activity Log'],
              ['cms', 'CMS'],
              ['settings', 'Settings'],
              ['email', 'Email'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 sm:px-4 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <AdminPendingPetitionsPanel initial={pending} />
            <AdminDeletePetitionPanel />
            <AdminIdDocsPanel initialDocs={pendingIds} />
            <Card rounded="2xl" className="p-5">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Fraud events</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {flags.map((f) => (
                  <li key={f.id} className="rounded-lg bg-zinc-100 p-3 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {f.details}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card rounded="3xl" className="p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Government submission summary</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">See overall submission counts and quickly access the government workflow dashboard.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('government')}
                className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open government panel
              </button>
            </div>
            <AdminGovernmentPanel />
          </Card>

          <AdminPollCreationPanel />

          <div className="grid gap-6 md:grid-cols-2">
            <AdminFraudPanel
              initialRules={rules}
              latestSnapshots={analytics.latestSnapshots}
            />
            <Card rounded="2xl" className="p-5">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Top triggered rules</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {analytics.topRules.map((rule) => (
                  <li key={rule.ruleKey} className="rounded-lg bg-zinc-100 p-3 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {rule.ruleKey} - {rule.count} events
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-neutral-400">
            <Link href="/admin/directory" className="text-emerald-600 hover:underline font-medium dark:text-emerald-400">
              Go to Directory Management →
            </Link>
          </p>
        </div>
      )}

      {/* Pending Polls Tab */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          <AdminPendingPollsPanel initial={pendingPolls} />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="p-6">
          <AdminUserManager />
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Card className="p-6">
          <GlobalAnalytics />
        </Card>
      )}

      {/* Government Tab */}
      {activeTab === 'government' && (
        <Card className="p-6">
          <AdminGovernmentPanel />
        </Card>
      )}

      {/* Officials Tab */}
      {activeTab === 'officials' && (
        <Card className="p-6">
          <AdminOfficialsVerificationPanel />
        </Card>
      )}

      {/* Geography Tab */}
      {activeTab === 'geography' && (
        <Card className="p-6">
          <AdminGeographicInsights />
        </Card>
      )}

      {/* Endorsements Tab */}
      {activeTab === 'endorsements' && (
        <Card className="p-6">
          <AdminEndorsementsPanel />
        </Card>
      )}

      {/* Ambassadors Tab */}
      {activeTab === 'ambassadors' && (
        <Card className="p-6">
          {token && (
            <Link href="/admin/ambassadors" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
              Go to Ambassadors Management →
            </Link>
          )}
        </Card>
      )}

      {/* CMS Tab */}
      {activeTab === 'cms' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Block-Based Page Editor</h2>
            <CMSPageBlockEditor />
          </Card>
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Page Management (Legacy)</h2>
            <CMSPageManager />
          </Card>
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Template Management</h2>
            <CMSTemplateManager />
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="p-6">
          <AdminSettings />
        </Card>
      )}

      {/* Payments Tab - Stripe */}
      {activeTab === 'payments' && (
        <ErrorBoundary name="Payments">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Payment Dashboard</h2>
              <AdminStripeDashboard />
            </Card>

            <Card className="p-6">
              <AdminStripePayments />
            </Card>

            <Card className="p-6">
              <AdminStripeSubscriptions />
            </Card>

            <Card className="p-6">
              <AdminStripeRefunds />
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Revenue Analytics</h2>
              <AdminStripeAnalytics />
            </Card>
          </div>
        </ErrorBoundary>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <ErrorBoundary name="Email">
          <Card className="p-6">
            <AdminEmailSettings />
          </Card>
        </ErrorBoundary>
      )}

      {/* Social Media Tab - Facebook & WhatsApp */}
      {activeTab === 'social-media' && (
        <Card className="p-6">
          <AdminSocialMediaDashboard />
        </Card>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity-log' && (
        <Card className="p-6">
          <AdminActivityLog />
        </Card>
      )}

      {/* Integrations Tab - Facebook */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Facebook Integration Dashboard</h2>
            <AdminFacebookDashboard />
          </Card>

          <Card className="p-6">
            <AdminFacebookPixel />
          </Card>

          <Card className="p-6">
            <AdminFacebookReach />
          </Card>

          <Card className="p-6">
            <AdminFacebookSocialFeatures />
          </Card>

          <Card className="p-6">
            <AdminFacebookEngagement />
          </Card>
        </div>
      )}
    </main>
  );
}
