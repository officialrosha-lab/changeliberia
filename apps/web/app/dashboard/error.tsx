'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Error</p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">Dashboard failed to load</h1>
        <p className="mt-3 text-sm text-zinc-600">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-zinc-400">Error ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
