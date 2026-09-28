import Image from 'next/image';
import Link from 'next/link';
import { getApiBase } from '../../lib/api';
import { SiteFooter } from '../../components/site-footer';
import { Card } from '../../components/ui/card';

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  type: string;
};

export const metadata = {
  title: 'Sponsors & Partners | Change Liberia',
  description: 'Organizations and partners supporting Change Liberia — and how your organization can join them.',
  alternates: { canonical: '/sponsors' },
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
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Backing civic accountability
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Sponsors &amp; partners
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Change Liberia stays free for every citizen because organizations like these help fund the infrastructure — hosting, verification, and moderation — behind every petition.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12">
          {sponsors.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-neutral-500">
              We&apos;re building our list of sponsors and partners — reach out below if you&apos;d like to be one of the first.
            </p>
          ) : (
            <>
              {sponsorList.length > 0 && (
                <section>
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
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                  {sponsors.map((s) => (
                    <SponsorCard key={s.id} sponsor={s} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <section className="px-4 pb-16 sm:pb-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 text-center dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-neutral-900 sm:p-12">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              Want your organization listed here?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-300">
              We work with businesses, NGOs, and civic organizations that want to support independent, citizen-driven accountability in Liberia. Tell us about your organization and how you&apos;d like to help.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:hello@changeliberia.org?subject=Sponsorship%20%2F%20Partnership%20Inquiry"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Get in touch
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border-2 border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const inner = (
    <Card rounded="2xl" className="flex h-32 flex-col items-center justify-center gap-3 dark:border-neutral-700! p-4 transition-shadow hover:shadow-md">
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
    </Card>
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
