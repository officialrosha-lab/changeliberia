import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';
import { StaggerContainer, StaggerItem } from './animations';

const STEPS = [
  {
    n: '1',
    emoji: '✍️',
    title: 'Start a petition',
    detail:
      'Describe what needs to change in your community or county. It takes under 3 minutes and is completely free.',
  },
  {
    n: '2',
    emoji: '🤝',
    title: 'Build verified support',
    detail:
      'Share your petition. Signatures from verified Liberians carry more weight with decision-makers than anonymous ones.',
  },
  {
    n: '3',
    emoji: '📢',
    title: 'Reach leaders & the public',
    detail:
      'Track momentum, post updates, and deliver signatures to the right people — from county superintendents to the Capitol.',
  },
];

export function HomeHowItWorks() {
  return (
    <FadeInOnScroll>
      <section id="how-it-works" className="bg-zinc-50 dark:bg-neutral-800/20 section-spacing">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              How it works
            </p>
            <h2 className="headline-serif mt-2 text-3xl text-zinc-900 dark:text-neutral-50 sm:text-4xl md:text-5xl">
              Civic action for Liberia, made simple
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600 dark:text-neutral-400 sm:text-base">
              Change Liberia gives every citizen the tools to raise real issues and create real
              change — from chiefdom to Capitol Hill.
            </p>
          </div>

          <StaggerContainer
            delay={0.2}
            staggerDelay={0.15}
            className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8"
          >
            {STEPS.map((s, i) => (
              <StaggerItem key={s.n}>
                <div className="relative rounded-2xl border border-zinc-100 bg-zinc-50 p-6 dark:border-neutral-800 dark:bg-neutral-800">
                  {/* Step number badge */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg shadow-sm dark:bg-emerald-500">
                      {s.emoji}
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {s.n}
                    </span>
                    {/* Connector line (desktop) */}
                    {i < STEPS.length - 1 && (
                      <span
                        className="absolute -right-4 top-11 hidden h-px w-8 border-t-2 border-dashed border-emerald-200 dark:border-emerald-900 md:block"
                        aria-hidden
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50 sm:text-lg">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
                    {s.detail}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="mt-10 text-center">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Start a petition — it&apos;s free
            </Link>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
