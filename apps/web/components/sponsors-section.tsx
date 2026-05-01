import Link from 'next/link';
import { getApiBase } from '../lib/api';
import { SponsorsMarquee } from './sponsors-marquee';

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  type: string;
};

export async function SponsorsSection() {
  let sponsors: Sponsor[] = [];
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/sponsors`, { cache: 'no-store' });
    if (res.ok) sponsors = (await res.json()) as Sponsor[];
  } catch {
    // silently skip if API is unreachable
  }

  if (!sponsors.length) return null;

  return (
    <section className="border-t border-zinc-200 py-10 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
          Sponsors &amp; Partners
        </p>
        <SponsorsMarquee sponsors={sponsors} />
        <div className="mt-6 text-center">
          <Link
            href="/sponsors"
            className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
          >
            View all sponsors &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
