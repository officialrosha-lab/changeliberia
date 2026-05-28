'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminFraudPanel } from '../../components/admin-fraud-panel';
import { AdminIdDocsPanel } from '../../components/admin-id-docs-panel';
import { AdminGovernmentPanel } from '../../components/admin-government-panel';
import { AdminPendingPetitionsPanel } from '../../components/admin-pending-petitions-panel';
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
import { ErrorBoundary } from '../../components/error-boundary';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'users' | 'analytics' | 'government' | 'cms' | 'settings' | 'ambassadors' | 'payments' | 'integrations' | 'email' | 'social-media' | 'activity-log'>('dashboard');
  const [phase, setPhase] = useState<'loading' | 'denied' | 'ok'>('loading');
  const [pending, setPending] = useState<{ id: string; title: string; category?: string | null; summary: string }[]>([]);
  const [pendingIds, setPendingIds] = useState<PendingIdDoc[]>([]);
  const [flags, setFlags] = useState<FraudEvent[]>([]);
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics>({
    latestSnapshots: [],
    topRules: [],
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<Me>('/users/me', token);
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          setPhase('denied');
          return;
        }
        const [p, ids, f, r, a] = await Promise.all([
          apiGet<{ id: string; title: string; category?: string | null; summary: string }[]>('/admin/petitions/pending', token),
          apiGet<PendingIdDoc[]>('/admin/id-documents/pending', token),
          apiGet<FraudEvent[]>('/admin/fraud/flags', token),
          apiGet<FraudRule[]>('/fraud/rules', token),
          apiGet<FraudAnalytics>('/fraud/analytics', token),
        ]);
        if (cancelled) return;
        setPending(p);
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
  }, [token]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-neutral-50">Admin Panel</h1>
        <Link href="/dashboard" className="text-emerald-600 hover:underline text-sm font-medium dark:text-emerald-400">
          Back to Dashboard
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 overflow-x-auto dark:border-neutral-800">
        {(
          [
            ['dashboard', 'Dashboard'],
            ['directory', 'Directory'],
            ['users', 'Users'],
            ['analytics', 'Analytics'],
            ['government', 'Government'],
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
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <AdminPendingPetitionsPanel initial={pending} />
            <AdminDeletePetitionPanel />
            <AdminIdDocsPanel initialDocs={pendingIds} />
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Fraud events</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {flags.map((f) => (
                  <li key={f.id} className="rounded-lg bg-zinc-100 p-3 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {f.details}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <AdminFraudPanel
              initialRules={rules}
              latestSnapshots={analytics.latestSnapshots}
            />
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Top triggered rules</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {analytics.topRules.map((rule) => (
                  <li key={rule.ruleKey} className="rounded-lg bg-zinc-100 p-3 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {rule.ruleKey} - {rule.count} events
                  </li>
                ))}
              </ul>
            </section>
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <AdminUserManager />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <GlobalAnalytics />
        </div>
      )}

      {/* Government Tab */}
      {activeTab === 'government' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <AdminGovernmentPanel />
        </div>
      )}

      {/* Ambassadors Tab */}
      {activeTab === 'ambassadors' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          {token && (
            <Link href="/admin/ambassadors" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
              Go to Ambassadors Management →
            </Link>
          )}
        </div>
      )}

      {/* CMS Tab */}
      {activeTab === 'cms' && (
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Block-Based Page Editor</h2>
            <CMSPageBlockEditor />
          </section>
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Page Management (Legacy)</h2>
            <CMSPageManager />
          </section>
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Template Management</h2>
            <CMSTemplateManager />
          </section>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <AdminSettings />
        </div>
      )}

      {/* Payments Tab - Stripe */}
      {activeTab === 'payments' && (
        <ErrorBoundary name="Payments">
          <div className="space-y-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Payment Dashboard</h2>
              <AdminStripeDashboard />
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <AdminStripePayments />
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <AdminStripeSubscriptions />
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <AdminStripeRefunds />
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Revenue Analytics</h2>
              <AdminStripeAnalytics />
            </section>
          </div>
        </ErrorBoundary>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <ErrorBoundary name="Email">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AdminEmailSettings />
          </div>
        </ErrorBoundary>
      )}

      {/* Social Media Tab - Facebook & WhatsApp */}
      {activeTab === 'social-media' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <AdminSocialMediaDashboard />
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity-log' && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <AdminActivityLog />
        </div>
      )}

      {/* Integrations Tab - Facebook */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-neutral-50">Facebook Integration Dashboard</h2>
            <AdminFacebookDashboard />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AdminFacebookPixel />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AdminFacebookReach />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AdminFacebookSocialFeatures />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <AdminFacebookEngagement />
          </section>
        </div>
      )}
    </main>
  );
}
