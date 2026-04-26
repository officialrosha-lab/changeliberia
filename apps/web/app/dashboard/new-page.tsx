'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  DashboardOverview,
  MyPetitions,
  SignedPetitions,
  ProfileSettings,
} from '../../components/dashboard';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'petitions' | 'signatures' | 'profile'>('overview');

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <p className="mt-2 text-zinc-600">
          Manage your petitions, signatures, and account settings.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('petitions')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'petitions'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          My Petitions
        </button>
        <button
          onClick={() => setActiveTab('signatures')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'signatures'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Signed Petitions
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Profile
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'petitions' && <MyPetitions />}
        {activeTab === 'signatures' && <SignedPetitions />}
        {activeTab === 'profile' && <ProfileSettings />}
      </div>
    </main>
  );
}
