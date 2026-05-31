'use client';

import Link from 'next/link';
import { apiGet } from '../../lib/api';

type PollSummary = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  county?: string | null;
  totalVotes: number;
  status: string;
  expiresAt: string;
};

export default async function CivicPulsePage() {
  const polls = await apiGet<PollSummary[]>('/polls').catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
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
              Browse live polls shaping Liberia today, vote on public issues, and create a new Civic Pulse question when you have admin access.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/polls"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-600"
            >
              View all polls
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Create a poll
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {polls.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-zinc-500 dark:text-zinc-400">No active polls are available right now. Check back soon or create a new Civic Pulse poll.</p>
          </div>
        ) : (
          polls.map((poll) => (
            <article
              key={poll.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
            >
              <Link href={`/polls/${poll.slug}`} className="group block">
                <h2 className="text-xl font-semibold text-zinc-900 transition group-hover:text-blue-600 dark:text-white">
                  {poll.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {poll.category ? `${poll.category} · ` : ''}
                  {poll.county ?? 'Nationwide'}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <span>{poll.status.toLowerCase()}</span>
                  <span>{poll.totalVotes.toLocaleString()} votes</span>
                </div>
                <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  View poll
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
