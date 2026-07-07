'use client';

import { useState } from 'react';
import { OfficialGuard } from '../../../components/official-guard';
import { OfficialDashboardOverview } from '../../../components/official-dashboard-overview';
import { OfficialConstituencyPanel } from '../../../components/official-constituency-panel';
import { OfficialPetitionFeed } from '../../../components/official-petition-feed';
import { OfficialInboxPanel } from '../../../components/official-inbox-panel';

const TABS = [
  ['overview', 'Overview'],
  ['constituency', 'My Constituency'],
  ['feed', 'Assigned Issues'],
  ['inbox', 'Government Inbox'],
] as const;

type Tab = (typeof TABS)[number][0];

export function OfficialDashboardClient() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <OfficialGuard>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-zinc-900">Official Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track petitions, civic pulse activity, and constituent messages for your jurisdiction.
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-zinc-200">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          {tab === 'overview' && <OfficialDashboardOverview />}
          {tab === 'constituency' && <OfficialConstituencyPanel />}
          {tab === 'feed' && <OfficialPetitionFeed />}
          {tab === 'inbox' && <OfficialInboxPanel />}
        </div>
      </main>
    </OfficialGuard>
  );
}
