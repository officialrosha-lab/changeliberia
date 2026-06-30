'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { PollSubmissionForm } from '../../components/poll-submission-form';
import { PollCard, type PollSummary } from '../../components/poll-card';

const CATEGORIES = [
  'Infrastructure', 'Education', 'Health', 'Governance',
  'Agriculture', 'Youth & Jobs', 'Environment', 'Women & Gender', 'Human Rights',
];

const SORT_OPTIONS = [
  { value: 'recent',  label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'name',    label: 'A–Z' },
] as const;

type SortValue = typeof SORT_OPTIONS[number]['value'];

const ONE_DAY_MS = 86_400_000;

function isNew(poll: PollSummary & { createdAt?: string }): boolean {
  if (!poll.createdAt) return false;
  return Date.now() - new Date(poll.createdAt).getTime() < ONE_DAY_MS;
}

function sortPolls(polls: PollSummary[], sort: SortValue): PollSummary[] {
  return [...polls].sort((a, b) => {
    if (sort === 'popular') return b.totalVotes - a.totalVotes;
    if (sort === 'name') return a.title.localeCompare(b.title);
    // recent: newest first via expiresAt as proxy (real createdAt not in PollSummary)
    return new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime();
  });
}

export default function CivicPulsePage() {
  const token = useAuthStore((s) => s.token);
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [sort, setSort] = useState<SortValue>('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  async function fetchPolls() {
    const data = await apiGet<PollSummary[]>('/polls?status=ACTIVE&sort=recent&limit=200').catch(() => []);
    setPolls(data);
  }

  useEffect(() => {
    void (async () => {
      try { await fetchPolls(); } finally { setLoading(false); }
    })();
  }, []);

  // Filter + sort in-memory
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const base = q ? polls.filter((p) => p.title.toLowerCase().includes(q)) : polls;
    return sortPolls(base, sort);
  }, [polls, debouncedSearch, sort]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, PollSummary[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    map.set('Other', []);
    for (const poll of filtered) {
      const key = CATEGORIES.includes(poll.category ?? '') ? (poll.category ?? 'Other') : 'Other';
      map.get(key)!.push(poll);
    }
    return map;
  }, [filtered]);

  // Category counts (unfiltered, for the badge numbers)
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const poll of polls) {
      const key = CATEGORIES.includes(poll.category ?? '') ? (poll.category ?? 'Other') : 'Other';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [polls]);

  const showFlat = debouncedSearch.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              Civic Pulse
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Active public sentiment polls
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Explore polls by topic, vote on public issues, and submit a poll idea for review.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {token ? (
              <button
                onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {showSubmissionForm ? 'Cancel' : 'Submit Poll Idea'}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Sign in to submit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Submission form */}
      {showSubmissionForm && token && (
        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">Submit a Poll Idea</h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Have a question for Liberia? Submit below. It will be reviewed and published once approved.
          </p>
          <PollSubmissionForm
            onSuccess={() => { setShowSubmissionForm(false); void fetchPolls(); }}
          />
        </div>
      )}

      {/* Search + Sort controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            placeholder="Search polls by name…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
          />
        </div>
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-zinc-500 dark:text-zinc-400">
            {debouncedSearch ? `No polls found for "${debouncedSearch}".` : 'No active polls right now. Check back soon or submit a poll idea.'}
          </p>
        </div>
      ) : showFlat ? (
        /* Flat search results */
        <div>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{debouncedSearch}&rdquo;
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((poll) => <PollCard key={poll.id} poll={poll} />)}
          </div>
        </div>
      ) : (
        /* Grouped by category */
        <div className="space-y-10">
          {CATEGORIES.map((cat) => {
            const catPolls = grouped.get(cat) ?? [];
            if (catPolls.length === 0) return null;
            return (
              <section key={cat}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{cat}</h2>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {catPolls.length}
                  </span>
                  <div className="flex-1 border-t border-zinc-100 dark:border-neutral-800" />
                  {catPolls.length > 3 && (
                    <Link
                      href={`/polls?category=${encodeURIComponent(cat)}`}
                      className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      See all
                    </Link>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catPolls.slice(0, 3).map((poll) => <PollCard key={poll.id} poll={poll} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
