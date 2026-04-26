'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CMSPageManager, CMSTemplateManager } from '../../components/cms';
import { AdminGuard } from '../../components/admin-guard';

export function CMSPageClient() {
  const [activeTab, setActiveTab] = useState<'pages' | 'templates'>('pages');

  return (
    <AdminGuard>
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Management System</h1>
        <Link href="/admin" className="text-emerald-600 hover:underline text-sm font-medium">
          Back to Admin
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 overflow-x-auto">
        {(
          [
            ['pages', 'Pages'],
            ['templates', 'Templates'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        {activeTab === 'pages' && <CMSPageManager />}
        {activeTab === 'templates' && <CMSTemplateManager />}
      </div>
    </main>
    </AdminGuard>
  );
}
