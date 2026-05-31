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

export default async function PollsPage() {
  const polls = await apiGet<PollSummary[]>('/polls').catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Civic Pulse
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Browse public sentiment polls and see what Liberians are voting on in real time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {polls.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-zinc-500 dark:text-zinc-400">No public polls are available right now.</p>
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
