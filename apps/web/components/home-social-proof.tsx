import { FadeInOnScroll } from './scroll-animations';

type PetitionStats = {
  totalPetitions: number;
  totalSignatures: number;
  campaignsWon: number;
  countiesReached: number;
};

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return n > 0 ? `${n}+` : '0';
}

export function HomeSocialProof({ stats }: { stats: PetitionStats | null }) {
  const STATS = [
    {
      value: stats ? formatStat(stats.totalPetitions) : '—',
      label: 'Petitions created',
    },
    {
      value: stats ? formatStat(stats.totalSignatures) : '—',
      label: 'Verified signatures',
    },
    {
      value: stats ? (stats.campaignsWon > 0 ? `${stats.campaignsWon}+` : '0') : '—',
      label: 'Campaigns won',
    },
    {
      value: stats ? `${stats.countiesReached}` : '15',
      label: 'Counties reached',
    },
  ];

  return (
    <FadeInOnScroll>
      <section className="border-y border-zinc-100 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-800/40 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-zinc-200 dark:md:divide-neutral-700">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:px-8">
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-3xl md:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-neutral-400 sm:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-neutral-500 sm:text-sm">
            Join Liberians using verified petitions to speak up for schools, roads, health, and
            justice — county by county.
          </p>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
