import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';

const FEATURES = [
  { icon: '⚡', text: 'Start in under 3 minutes' },
  { icon: '🔒', text: 'Verified signatures only' },
  { icon: '📍', text: 'Reach the right Liberian leaders' },
];

export function HomeDraftCta() {
  return (
    <FadeInOnScroll>
      <section className="bg-zinc-50 dark:bg-neutral-900 section-spacing">
        <div className="mx-auto max-w-4xl px-4">
          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-neutral-900">
            <div className="grid gap-0 md:grid-cols-2">
              {/* Left — copy */}
              <div className="p-8 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Your voice matters
                </p>
                <h2 className="headline-serif mt-2 text-3xl text-zinc-900 dark:text-neutral-50 sm:text-4xl">
                  We help you shape a clear petition
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400 sm:text-base">
                  A few sentences about a problem in your community are enough to start.
                  Add details, photos, and updates as your campaign grows — from
                  Gbarnga to Harper.
                </p>
                <Link
                  href="/create"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Start your petition →
                </Link>
              </div>

              {/* Right — feature checklist */}
              <div className="flex flex-col justify-center gap-4 border-t border-emerald-100 bg-emerald-600/5 p-8 dark:border-emerald-900/40 dark:bg-emerald-950/20 md:border-l md:border-t-0 md:p-10">
                {FEATURES.map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">
                      {f.icon}
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-neutral-300">
                      {f.text}
                    </p>
                  </div>
                ))}
                <p className="mt-2 text-xs text-zinc-400 dark:text-neutral-500">
                  Free to create. No account needed to browse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
