'use client';

import { useState } from 'react';
import { OfficialGuard } from '../../../components/official-guard';
import { OfficialDashboardOverview } from '../../../components/official-dashboard-overview';
import { OfficialConstituencyPanel } from '../../../components/official-constituency-panel';
import { OfficialPetitionFeed } from '../../../components/official-petition-feed';
import { OfficialCivicPulsePanel } from '../../../components/official-civic-pulse-panel';
import { OfficialIssueTrendsPanel } from '../../../components/official-issue-trends-panel';
import { OfficialAnalyticsPanel } from '../../../components/official-analytics-panel';
import { OfficialInboxPanel } from '../../../components/official-inbox-panel';
import { OfficialStaffPanel } from '../../../components/official-staff-panel';

const TABS = [
  ['overview', 'Overview'],
  ['constituency', 'My Constituency'],
  ['feed', 'Assigned Issues'],
  ['pulse', 'Civic Pulse'],
  ['issues', 'Issues'],
  ['analytics', 'Analytics'],
  ['inbox', 'Government Inbox'],
  ['staff', 'Office Staff'],
] as const;

type Tab = (typeof TABS)[number][0];

// Grouped sidebar nav — the flat horizontal tab bar this replaced worked
// fine at 5 tabs but degrades badly past ~8, which this milestone's new
// Civic Pulse/Issues/Analytics tabs pushed past.
const TAB_GROUPS: { label: string; keys: Tab[] }[] = [
  { label: 'Constituency', keys: ['overview', 'constituency', 'feed', 'pulse', 'issues'] },
  { label: 'Operations', keys: ['analytics'] },
  { label: 'Engagement', keys: ['inbox'] },
  { label: 'Account', keys: ['staff'] },
];

function labelFor(key: Tab): string {
  return TABS.find(([k]) => k === key)?.[1] ?? key;
}

export function OfficialDashboardClient() {
  const [tab, setTab] = useState<Tab>('overview');
  const activeLabel = labelFor(tab);

  return (
    <OfficialGuard>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Official Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Track petitions, civic pulse activity, and constituent messages for your jurisdiction.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Mobile: dropdown selector */}
          <div className="md:hidden">
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value as Tab)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              {TAB_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.keys.map((key) => (
                    <option key={key} value={key}>
                      {labelFor(key)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Desktop: grouped sidebar */}
          <nav className="hidden space-y-6 md:block">
            {TAB_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-neutral-500">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.keys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        tab === key
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
                      }`}
                    >
                      {labelFor(key)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="min-w-0 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="sr-only">{activeLabel}</h2>
            {tab === 'overview' && <OfficialDashboardOverview />}
            {tab === 'constituency' && <OfficialConstituencyPanel />}
            {tab === 'feed' && <OfficialPetitionFeed />}
            {tab === 'pulse' && <OfficialCivicPulsePanel />}
            {tab === 'issues' && <OfficialIssueTrendsPanel />}
            {tab === 'analytics' && <OfficialAnalyticsPanel />}
            {tab === 'inbox' && <OfficialInboxPanel />}
            {tab === 'staff' && <OfficialStaffPanel />}
          </div>
        </div>
      </main>
    </OfficialGuard>
  );
}
