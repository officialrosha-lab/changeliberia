import Link from 'next/link';

const CATEGORY_COLORS: Record<string, { badge: string; glow: string; bar: string }> = {
  Infrastructure:   { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',   glow: 'from-blue-500/10 to-transparent',   bar: 'bg-blue-500' },
  Education:        { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', glow: 'from-amber-500/10 to-transparent',   bar: 'bg-amber-500' },
  Health:           { badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',         glow: 'from-red-500/10 to-transparent',     bar: 'bg-red-500' },
  Governance:       { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', glow: 'from-purple-500/10 to-transparent', bar: 'bg-purple-500' },
  Agriculture:      { badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', glow: 'from-green-500/10 to-transparent',   bar: 'bg-emerald-500' },
  'Youth & Jobs':   { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', glow: 'from-orange-500/10 to-transparent', bar: 'bg-orange-500' },
  Environment:      { badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',     glow: 'from-teal-500/10 to-transparent',   bar: 'bg-teal-500' },
  'Women & Gender': { badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',     glow: 'from-pink-500/10 to-transparent',   bar: 'bg-pink-500' },
  'Human Rights':   { badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', glow: 'from-indigo-500/10 to-transparent', bar: 'bg-indigo-500' },
};

const DEFAULT_THEME = {
  badge: 'bg-zinc-100 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300',
  glow: 'from-emerald-500/10 to-transparent',
  bar: 'bg-emerald-500',
};

function closesIn(expiresAt: string): { text: string; urgent: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms < 0) return { text: 'Closed', urgent: false };
  const days = Math.floor(ms / 86_400_000);
  if (days > 1) return { text: `${days}d left`, urgent: false };
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return { text: `${hours}h left`, urgent: true };
  return { text: 'Closes soon', urgent: true };
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
  const theme = CATEGORY_COLORS[poll.category ?? ''] ?? DEFAULT_THEME;
  const expiry = closesIn(poll.expiresAt);
  const isLive = poll.status === 'ACTIVE' || poll.status === 'APPROVED';

  return (
    <Link href={`/polls/${poll.slug}`}>
      <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-zinc-200/60 dark:border-neutral-700/60 dark:bg-neutral-900 dark:hover:shadow-neutral-900/80">
        {/* Top colour accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${theme.bar} opacity-70`} />

        {/* Glow bg */}
        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${theme.glow} pointer-events-none`} />

        <div className="relative flex flex-1 flex-col p-6">
          {/* Pills row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {poll.category && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.badge}`}>
                {poll.category}
              </span>
            )}
            {poll.county && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-neutral-800 dark:text-neutral-400">
                {poll.county}
              </span>
            )}
            {isLive && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="flex-1 text-base font-bold leading-snug text-zinc-900 line-clamp-3 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
            {poll.title}
          </h3>

          {/* Divider */}
          <div className="my-4 h-px bg-zinc-100 dark:bg-neutral-800" />

          {/* Stats + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {poll.totalVotes.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">votes cast</span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <span className={`text-sm font-bold ${expiry.urgent ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {expiry.text}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">deadline</span>
            </div>
          </div>

          {/* Vote CTA button */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition-all group-hover:bg-emerald-600 group-hover:text-white dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
            Cast your vote
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
