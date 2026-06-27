import Link from 'next/link';

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Education:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Health:           'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Governance:       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  Agriculture:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Youth & Jobs':   'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Environment:      'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Women & Gender': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Human Rights':   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
};

function closesIn(expiresAt: string): { text: string; urgent: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms < 0) return { text: 'Closed', urgent: false };
  const days = Math.floor(ms / 86_400_000);
  if (days > 1) return { text: `Closes in ${days}d`, urgent: false };
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return { text: `Closes in ${hours}h`, urgent: true };
  return { text: 'Closes today!', urgent: true };
}

export type PollSummary = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  county?: string | null;
  totalVotes: number;
  status: string;
  expiresAt: string;
};

export function PollCard({ poll }: { poll: PollSummary }) {
  const categoryColor = CATEGORY_COLORS[poll.category ?? ''] ?? 'bg-zinc-100 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300';
  const expiry = closesIn(poll.expiresAt);

  return (
    <article className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
      <Link href={`/polls/${poll.slug}`} className="flex h-full flex-col">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {poll.category && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor}`}>
              {poll.category}
            </span>
          )}
          {poll.county && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
              {poll.county}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="flex-1 text-lg font-bold leading-snug text-zinc-900 line-clamp-2 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
          {poll.title}
        </h3>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {poll.totalVotes.toLocaleString()} votes
          </span>
          <span className="text-zinc-300 dark:text-neutral-700">·</span>
          <span className={expiry.urgent ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}>
            {expiry.text}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:gap-2 transition-all dark:text-emerald-400">
            Vote now
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}
