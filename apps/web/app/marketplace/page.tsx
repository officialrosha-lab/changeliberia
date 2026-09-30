import Link from 'next/link';
import { getApiBase } from '../../lib/api';
import { SiteFooter } from '../../components/site-footer';
import { Card } from '../../components/ui/card';

export const metadata = {
  title: 'Marketplace | Change Liberia',
  description:
    'Optional paid tools that fund the platform — petition promotion, sponsorships, research products, events, API access, and professional services. Signing, following, and viewing petitions stays free forever.',
  alternates: { canonical: '/marketplace' },
};

type FeaturedPetition = {
  id: string;
  title: string;
  summary: string;
  signaturesCount: number;
};

const PRODUCTS = [
  {
    href: '/sponsorships',
    icon: '🏢',
    title: 'Sponsorships',
    description: 'Put your organization’s name behind civic accountability with a listed sponsorship package.',
  },
  {
    href: '/research',
    icon: '📊',
    title: 'Research products',
    description: 'Data reports and analysis products built from platform-wide petition and civic engagement trends.',
  },
  {
    href: '/events',
    icon: '🎟️',
    title: 'Events',
    description: 'Workshops, briefings, and convenings — some free, some ticketed.',
  },
  {
    href: '/developers',
    icon: '🔌',
    title: 'API access',
    description: 'Programmatic access to platform data for newsrooms, researchers, and civic-tech developers.',
  },
  {
    href: '/studio',
    icon: '🛠️',
    title: 'Change Liberia Studio',
    description: 'Request professional services — campaign strategy, data work, or custom civic tooling.',
  },
];

export default async function MarketplacePage() {
  let featured: FeaturedPetition[] = [];
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/petitions/featured`, { cache: 'no-store' });
    if (res.ok) featured = (await res.json()) as FeaturedPetition[];
  } catch {
    // silently skip if API is unreachable
  }

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Optional, and never a gate to civic participation
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Marketplace
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              These paid tools fund the free platform. Creating, signing, following, and viewing petitions — and a
              verified lawmaker&apos;s basic constituency access — stays free forever, no matter what.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <Link key={p.href} href={p.href}>
                <Card
                  rounded="2xl"
                  className="h-full p-6 transition-shadow hover:shadow-md"
                >
                  <span className="text-3xl">{p.icon}</span>
                  <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
                    {p.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {featured.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
                Featured petitions
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-neutral-400">
                Advocates can pay to feature a petition here — it never affects the signature count or how the
                government must respond.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <Link key={p.id} href={`/petitions/${p.id}`}>
                    <Card rounded="2xl" className="h-full p-5 transition-shadow hover:shadow-md">
                      <h3 className="font-bold text-zinc-900 dark:text-white">{p.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-neutral-400">{p.summary}</p>
                      <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {p.signaturesCount.toLocaleString()} signatures
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
