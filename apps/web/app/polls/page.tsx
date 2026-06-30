'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../../lib/api';
import { PollCard, type PollSummary } from '../../components/poll-card';

const SORT_OPTIONS = [
  { value: 'recent',  label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'name',    label: 'A–Z' },
] as const;

type SortValue = typeof SORT_OPTIONS[number]['value'];

function isNew(expiresAt: string, createdAt?: string): boolean {
  // PollSummary doesn't carry createdAt so we approximate using expiresAt absence — skip badge if we can't tell
  return false;
}

export default function PollsPage() {
  const [sort, setSort] = useState<SortValue>('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: 'ACTIVE', sort });
    if (debouncedSearch) params.set('search', debouncedSearch);
    apiGet<PollSummary[]>(`/polls?${params}`)
      .then(setPolls)
      .catch(() => setPolls([]))
      .finally(() => setLoading(false));
  }, [sort, debouncedSearch]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          All Polls
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Browse public sentiment polls and see what Liberians are voting on in real time.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search polls…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
          />
        </div>

        {/* Sort pills */}
        <div className="flex gap-2">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                sort === value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900" />
          ))
        ) : polls.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-zinc-500 dark:text-zinc-400">
              {debouncedSearch ? `No polls found for "${debouncedSearch}".` : 'No active polls right now. Check back soon.'}
            </p>
          </div>
        ) : (
          polls.map((poll) => <PollCard key={poll.id} poll={poll} />)
        )}
      </div>
    </main>
  );
}
