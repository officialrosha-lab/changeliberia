import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';

export function HomeContributeBanner() {
  return (
    <FadeInOnScroll>
      <section className="relative overflow-hidden bg-emerald-700 dark:bg-emerald-900 section-spacing">
        {/* Radial gradient depth accent */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#34d399_0%,_transparent_60%)] opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 dark:text-emerald-300">
            For every Liberian
          </p>
          <h2 className="headline-serif mt-3 text-3xl text-white sm:text-4xl md:text-5xl">
            Ready to make change happen?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-100 sm:text-base md:mt-5">
            Change Liberia is built for transparency and trust. From ward to Capitol Hill, your
            petition keeps leaders accountable and gives every Liberian a verified voice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-8 py-3 text-sm font-bold text-zinc-900 shadow-md transition-all hover:bg-amber-300 hover:shadow-lg active:scale-95"
            >
              Start a petition — it&apos;s free
            </Link>
            <Link
              href="/petitions"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/70 px-8 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10 active:scale-95"
            >
              Browse petitions
            </Link>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
