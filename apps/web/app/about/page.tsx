import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../../components/site-footer';
import { fetchCmsPage, getSection } from '../../lib/cms';

export const metadata: Metadata = {
  title: 'About — Change Liberia',
  description: 'Learn about Change Liberia — who runs it, our mission, and how we hold power accountable.',
};

const TEAM = [
  { role: 'Platform Director', name: 'Change Liberia Initiative' },
  { role: 'Technical Lead', name: 'Engineering Team' },
  { role: 'Community Liaison', name: 'Civil Society Partners' },
];

const VALUES = [
  {
    icon: '🔍',
    title: 'Transparency',
    body: 'Every petition lifecycle is tracked publicly — from creation to government response. Citizens deserve to see what happens with their voices.',
  },
  {
    icon: '🛡️',
    title: 'Trust & Integrity',
    body: 'We verify identities through phone, email, and national ID to ensure that every signature carries real weight.',
  },
  {
    icon: '⚖️',
    title: 'Accountability',
    body: 'We route petitions to the right authority and publicly track whether a response was given. Silence is also an answer.',
  },
  {
    icon: '🌍',
    title: 'Inclusion',
    body: 'Change Liberia is for every Liberian — at home and in the diaspora. Anyone with a Liberian connection can raise an issue.',
  },
];

export default async function AboutPage() {
  const cms = await fetchCmsPage('about');
  const heroHtml = getSection(cms, 'hero');
  const missionHtml = getSection(cms, 'mission');
  const valuesHtml = getSection(cms, 'values');
  const governanceHtml = getSection(cms, 'governance');
  const contactHtml = getSection(cms, 'contact');

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Hero */}
        <section className="bg-emerald-700 px-4 py-20 text-center dark:bg-emerald-900">
          {heroHtml ? (
            <div dangerouslySetInnerHTML={{ __html: heroHtml }} />
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">About us</p>
              <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
                Built for Liberians, <br className="hidden sm:block" />
                by Liberians.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-emerald-100 sm:text-lg">
                Change Liberia is a civic petition platform that gives every Liberian — from
                Montserrado to Lofa — the tools to raise real issues, build verified public
                support, and deliver their voices to the people who can act on them.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow hover:bg-emerald-50"
            >
              Start a petition
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              How it works
            </Link>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          {missionHtml ? (
            <div dangerouslySetInnerHTML={{ __html: missionHtml }} />
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Our mission
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50 sm:text-4xl">
                Turning citizen voices into government action
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
                Liberia is a democracy — but democratic participation should not require money,
                political connections, or media access. Change Liberia removes those barriers.
                We provide the infrastructure for any citizen to raise a credible issue, gather
                verified public support, and have it formally delivered to the relevant institution
                with a public paper trail.
              </p>
            </>
          )}
        </section>

        {/* Values */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl">
            {valuesHtml ? (
              <div dangerouslySetInnerHTML={{ __html: valuesHtml }} />
            ) : (
              <>
                <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Our values
                </p>
                <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                  What we stand for
                </h2>
                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  {VALUES.map((v) => (
                    <div
                      key={v.title}
                      className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">
                        {v.icon}
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-neutral-50">
                        {v.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
                        {v.body}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Governance */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          {governanceHtml ? (
            <div dangerouslySetInnerHTML={{ __html: governanceHtml }} />
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Governance &amp; ownership
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                Who runs Change Liberia?
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
                <p>
                  Change Liberia is operated as a civic technology initiative committed to the
                  public interest. The platform is independently funded and does not accept
                  political donations or endorsements from any party, candidate, or government
                  body.
                </p>
                <p>
                  Our editorial and moderation policies are documented and publicly available.
                  Petitions are reviewed for compliance with community guidelines before approval
                  — not for political alignment. No legitimate civic grievance is suppressed.
                </p>
                <p>
                  We operate under Liberian law and comply with all applicable data protection
                  regulations. User identity data is stored securely and is never shared with
                  third parties or government agencies without a lawful court order.
                </p>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {TEAM.map((t) => (
                  <div
                    key={t.role}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">
                      🏛️
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-500">
                      {t.role}
                    </p>
                    <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-neutral-50">
                      {t.name}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Contact */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-2xl text-center">
            {contactHtml ? (
              <div dangerouslySetInnerHTML={{ __html: contactHtml }} />
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Get in touch
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                  Contact us
                </h2>
                <p className="mt-4 text-base text-zinc-600 dark:text-neutral-400">
                  For platform inquiries, partnership proposals, media requests, or to report
                  abuse, reach us at:
                </p>
                <div className="mt-6 space-y-2 text-sm font-medium text-zinc-700 dark:text-neutral-300">
                  <p>
                    Email:{' '}
                    <a
                      href="mailto:hello@changelib.org"
                      className="text-emerald-600 underline dark:text-emerald-400"
                    >
                      hello@changelib.org
                    </a>
                  </p>
                  <p>WhatsApp: +231 77 000 0000</p>
                  <p>Monrovia, Liberia</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            Ready to create change?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600 dark:text-neutral-400">
            Your issue matters. Change Liberia gives it the platform it deserves.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700"
            >
              Start a petition — it&apos;s free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              See how it works
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
