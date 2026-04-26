import Image from 'next/image';
import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';

type Petition = {
  id: string;
  title: string;
  summary: string;
  signaturesCount: number;
  imageUrl?: string | null;
};

export function HomeFeaturedStory({ petition }: { petition: Petition }) {
  return (
    <FadeInOnScroll>
      <section className="bg-zinc-50 dark:bg-neutral-900 section-spacing">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-500">
            🔥 Trending campaign
          </p>

          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800 md:flex">
            {/* Image */}
            <div className="relative h-56 shrink-0 overflow-hidden bg-zinc-200 dark:bg-neutral-700 md:h-auto md:w-2/5">
              <Image
                src={petition.imageUrl || '/globe.svg'}
                alt=""
                fill
                className="object-cover transition duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 480px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r md:from-black/30 md:to-transparent" />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  🟢 Active
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  ✎ {petition.signaturesCount.toLocaleString()} signatures
                </span>
              </div>

              <h2 className="headline-serif mt-4 text-2xl leading-snug text-zinc-900 dark:text-neutral-50 sm:text-3xl md:text-4xl break-words">
                {petition.title}
              </h2>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400 sm:text-base">
                {petition.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/petitions/${petition.id}#sign`}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Sign this petition
                </Link>
                <Link
                  href={`/petitions/${petition.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                >
                  Read full story →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FadeInOnScroll>
  );
}
