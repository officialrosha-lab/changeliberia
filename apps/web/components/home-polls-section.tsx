import Link from 'next/link';
import { apiGet } from '../lib/api';
import { PollCard, type PollSummary } from './poll-card';

export default async function HomePollsSection() {
  const polls = await apiGet<PollSummary[]>('/polls').catch(() => []);
  const featured = polls.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            Civic Pulse
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Public sentiment polls live from the movement.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Discover the conversations shaping Liberia today and join the civic pulse by voting on public polls.
          </p>
        </div>
        <Link
          href="/civic-pulse"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View all polls
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-zinc-300">
            No polls are live yet. Check back soon for new civic pulse questions.
          </div>
        ) : (
          featured.map((poll) => <PollCard key={poll.id} poll={poll} />)
        )}
      </div>
    </section>
  );
}
