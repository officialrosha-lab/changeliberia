import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';
import { StaggerContainer, StaggerItem } from './animations';

const STEPS = [
  {
    n: '1',
    emoji: '✍️',
    title: 'Submit your issue',
    detail: 'Describe what needs to change. Choose categories, add prior actions taken, and set your signature goal. Takes under 3 minutes.',
  },
  {
    n: '2',
    emoji: '🔎',
    title: 'Petition is reviewed',
    detail: 'Our team reviews every petition within 24–48 hours to confirm it is a genuine civic issue. Legitimate grievances are never suppressed.',
  },
  {
    n: '3',
    emoji: '🤝',
    title: 'People sign & support',
    detail: 'Share your petition. Verified Liberian signatures carry far more weight with decision-makers than unverified ones.',
  },
  {
    n: '4',
    emoji: '📊',
    title: 'Threshold reached',
    detail: 'At 1,000 verified signatures a formal PDF report is generated, ready for official submission to the right authority.',
  },
  {
    n: '5',
    emoji: '📬',
    title: 'Delivered to authority',
    detail: 'Smart routing identifies the correct Ministry, Legislature, or County official and delivers the petition formally with a digital record.',
  },
  {
    n: '6',
    emoji: '📣',
    title: 'Response tracked publicly',
    detail: 'The official response — or silence — is tracked and shown publicly on the petition page. No response is also a public fact.',
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
              Change Liberia is a structured civic process — from a citizen raising an issue
              to a government authority formally receiving and responding to it.
            </p>
          </div>

          <StaggerContainer
            delay={0.2}
            staggerDelay={0.1}
            className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            {STEPS.map((s, i) => (
              <StaggerItem key={s.n}>
                <div className="relative rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg shadow-sm dark:bg-emerald-500">
                      {s.emoji}
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {s.n}
                    </span>
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

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Start a petition — it&apos;s free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Full process details →
            </Link>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
