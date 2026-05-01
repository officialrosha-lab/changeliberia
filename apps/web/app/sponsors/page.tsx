import Image from 'next/image';
import Link from 'next/link';
import { getApiBase } from '../../lib/api';
import { SiteFooter } from '../../components/site-footer';

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  type: string;
};

export const metadata = {
  title: 'Sponsors & Partners | Change Liberia',
  description: 'Organizations and partners supporting Change Liberia',
};

export default async function SponsorsPage() {
  let sponsors: Sponsor[] = [];
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/sponsors`, { cache: 'no-store' });
    if (res.ok) sponsors = (await res.json()) as Sponsor[];
  } catch {
    // silently skip if API is unreachable
  }

  const sponsorList = sponsors.filter((s) => s.type === 'sponsor');
  const partnerList = sponsors.filter((s) => s.type === 'partner');

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-2">
          <Link href="/" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            &larr; Back to home
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-neutral-50">
          Sponsors &amp; Partners
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-neutral-400">
          Organizations that support Change Liberia's mission of civic engagement.
        </p>

        {sponsors.length === 0 ? (
          <p className="mt-12 text-center text-zinc-500 dark:text-neutral-500">
            No sponsors or partners listed yet.
          </p>
        ) : (
          <>
            {sponsorList.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
                  Sponsors
                </h2>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                  {sponsorList.map((s) => (
                    <SponsorCard key={s.id} sponsor={s} />
                  ))}
                </div>
              </section>
            )}

            {partnerList.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
                  Partners
                </h2>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                  {partnerList.map((s) => (
                    <SponsorCard key={s.id} sponsor={s} />
                  ))}
                </div>
              </section>
            )}

            {sponsorList.length === 0 && partnerList.length === 0 && (
              <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                {sponsors.map((s) => (
                  <SponsorCard key={s.id} sponsor={s} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const inner = (
    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <Image
        src={sponsor.logoUrl}
        alt={sponsor.name}
        width={120}
        height={56}
        className="max-h-14 w-auto max-w-[120px] object-contain grayscale transition-all duration-300 hover:grayscale-0"
        unoptimized
      />
      <p className="text-center text-xs font-medium text-zinc-600 dark:text-neutral-400">
        {sponsor.name}
      </p>
    </div>
  );

  if (sponsor.websiteUrl) {
    return (
      <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}
