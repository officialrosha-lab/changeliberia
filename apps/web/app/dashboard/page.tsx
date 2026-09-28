import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DashboardClient } from './dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard — Change Liberia',
  description: 'Manage your petitions, track signatures, and see your Change Liberia activity in one place.',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-500">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
