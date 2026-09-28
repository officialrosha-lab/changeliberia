'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function OfficialProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Official profile error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Error</p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-neutral-50">This profile couldn&apos;t load</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-neutral-400">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Try again
          </button>
          <Link
            href="/leaders"
            className="rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            Back to leaders
          </Link>
        </div>
      </div>
    </main>
  );
}
