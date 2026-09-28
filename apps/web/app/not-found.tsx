import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 max-w-md text-zinc-500 dark:text-zinc-400">
          The page you&apos;re looking for may have moved or no longer exists. Try one of the links
          below, or head back to the homepage.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Go home
        </Link>
        <Link
          href="/petitions"
          className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:text-zinc-300 dark:hover:bg-neutral-800"
        >
          Browse petitions
        </Link>
        <Link
          href="/help-center"
          className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:text-zinc-300 dark:hover:bg-neutral-800"
        >
          Help center
        </Link>
      </div>
    </div>
  );
}
