import { Suspense } from 'react';
import { DashboardClient } from './dashboard-client';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-500">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
