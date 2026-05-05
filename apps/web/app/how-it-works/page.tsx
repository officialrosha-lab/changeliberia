import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../../components/site-footer';
import { fetchCmsPage, getSection } from '../../lib/cms';

export const metadata: Metadata = {
  title: 'How It Works — Change Liberia',
  description: 'A step-by-step guide to creating a petition, building support, and reaching decision-makers on Change Liberia.',
};

const STAGES = [
  {
    n: '01',
    icon: '✍️',
    color: 'bg-blue-50 dark:bg-blue-950',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    title: 'Submit your issue',
    body: 'Create a petition in minutes. Describe the problem clearly, choose the relevant category — infrastructure, health, governance, or more — and explain what steps you have already taken.',
    detail: [
      'No fees, no paperwork',
      'Upload supporting images or documents',
      'Categorise across multiple sectors',
      'Mark prior actions already taken',
    ],
  },
  {
    n: '02',
    icon: '🔎',
    color: 'bg-amber-50 dark:bg-amber-950',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    title: 'Petition is reviewed',
    body: 'Our moderation team reviews every petition to ensure it is a genuine civic issue that complies with community guidelines. This usually takes 24–48 hours. We never suppress legitimate grievances.',
    detail: [
      'Independent moderation process',
      'Declined petitions receive a reason',
      'You can appeal a decision',
      'Review criteria are publicly documented',
    ],
  },
  {
    n: '03',
    icon: '🤝',
    color: 'bg-emerald-50 dark:bg-emerald-950',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    title: 'People sign & support',
    body: 'Once approved, your petition is published on Change Liberia. Share it on WhatsApp, Facebook, and in your community. Verified Liberian signatures carry more weight with decision-makers.',
    detail: [
      'Phone and email verification increases credibility',
      'Verified diaspora signatures count too',
      'Real-time signature counter',
      'Milestone notifications sent to supporters',
    ],
  },
  {
    n: '04',
    icon: '📊',
    color: 'bg-purple-50 dark:bg-purple-950',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    title: 'Signature threshold reached',
    body: 'When your petition reaches its target — typically 1,000 verified signatures — it becomes eligible for official submission. The platform prepares a formal report with all signature data.',
    detail: [
      'Automated threshold notification',
      'Downloadable PDF petition report',
      'Signature authenticity data included',
      'You choose when to submit',
    ],
  },
  {
    n: '05',
    icon: '📬',
    color: 'bg-rose-50 dark:bg-rose-950',
    iconBg: 'bg-rose-100 dark:bg-rose-900',
    title: 'Routed to the right authority',
    body: "Change Liberia's smart routing system identifies the correct institution — Ministry, Legislature, County Superintendent, or NGO — and delivers the petition formally with a digital signature record.",
    detail: [
      'Intelligent routing to the right official',
      'Formal email submission with petition report',
      'Delivery confirmation recorded',
      'Manual routing override available',
    ],
  },
  {
    n: '06',
    icon: '⏳',
    color: 'bg-orange-50 dark:bg-orange-950',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    title: 'Response tracked publicly',
    body: "The authority's response — or lack thereof — is tracked and shown publicly on the petition page. Supporters receive notifications. Silence is recorded as a public fact.",
    detail: [
      'Response status shown on petition page',
      'Supporters notified of updates',
      'Timeline of all events displayed',
      'No-response is documented publicly',
    ],
  },
  {
    n: '07',
    icon: '✅',
    color: 'bg-teal-50 dark:bg-teal-950',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    title: 'Outcome published',
    body: 'When a response is received, the outcome is published on the petition and shared with all supporters. Successful petitions become examples that inspire more civic action.',
    detail: [
      'Official response posted verbatim',
      'Campaign outcome marked (won / acknowledged / no response)',
      'Success story promoted to inspire others',
      'Impact statistics updated',
    ],
  },
];

export default async function HowItWorksPage() {
  const cms = await fetchCmsPage('how-it-works');
  const heroHtml = getSection(cms, 'hero');
  const stagesHtml = getSection(cms, 'stages');
  const trustHtml = getSection(cms, 'trust');
  const faqsHtml = getSection(cms, 'faqs');

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Hero */}
        <section className="bg-zinc-900 px-4 py-20 text-center dark:bg-neutral-900">
          {heroHtml ? (
            <div dangerouslySetInnerHTML={{ __html: heroHtml }} />
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                How it works
              </p>
              <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
                From issue to action — <br className="hidden sm:block" />
                step by step.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
                Change Liberia is not just a petition tool. It is a structured civic process
                that connects citizens directly to decision-makers with verified public evidence.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow hover:bg-emerald-400"
            >
              Start a petition
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              About the platform
            </Link>
          </div>
        </section>

        {/* Step-by-step timeline */}
        <section className="mx-auto max-w-4xl px-4 py-20">
          {stagesHtml ? (
            <div dangerouslySetInnerHTML={{ __html: stagesHtml }} />
          ) : (
            <>
              <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                The process
              </p>
              <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                7 stages of change
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-600 dark:text-neutral-400">
                Every petition follows this transparent lifecycle — publicly visible at every stage.
              </p>
            </>
          )}

          <div className="mt-12 space-y-6">
            {STAGES.map((s, i) => (
              <div key={s.n} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${s.iconBg}`}
                  >
                    {s.icon}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="mt-2 w-0.5 flex-1 bg-zinc-200 dark:bg-neutral-700" />
                  )}
                </div>
                <div className={`mb-6 flex-1 rounded-2xl ${s.color} border border-transparent p-5`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-zinc-400 dark:text-neutral-500">
                      STEP {s.n}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-neutral-50">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
                    {s.body}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {s.detail.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-neutral-500">
                        <span className="mt-0.5 text-emerald-500">✓</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust section */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-4xl">
            {trustHtml ? (
              <div dangerouslySetInnerHTML={{ __html: trustHtml }} />
            ) : (
              <>
                <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Why it works
                </p>
                <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                  Built on verified trust
                </h2>
                <div className="mt-10 grid gap-6 sm:grid-cols-3">
                  {[
                    { icon: '📱', title: 'Phone verification', body: 'Every signer verifies their phone number, confirming they are a real person.' },
                    { icon: '🪪', title: 'ID verification', body: 'High-trust signatures come from users who upload a national ID or passport.' },
                    { icon: '🔒', title: 'Fraud detection', body: 'Our system detects and removes bot signatures, duplicate accounts, and anomalous patterns.' },
                  ].map((c) => (
                    <div key={c.title} className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl dark:bg-emerald-950">
                        {c.icon}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-neutral-50">{c.title}</h3>
                      <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">{c.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          {faqsHtml ? (
            <div dangerouslySetInnerHTML={{ __html: faqsHtml }} />
          ) : (
            <>
              <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                FAQ
              </p>
              <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
                Common questions
              </h2>
              <div className="mt-10 space-y-4">
                {[
                  { q: 'Do I need to be a Liberian citizen to use Change Liberia?', a: 'You need a Liberian connection — citizen, resident, or diaspora. You will need a valid phone number to verify your identity.' },
                  { q: 'Is it free to create a petition?', a: 'Yes, completely free. Creating, signing, and sharing petitions costs nothing.' },
                  { q: 'What happens if my petition is rejected?', a: 'You will receive a reason. If your petition is a genuine civic issue that complies with our guidelines, you can revise and resubmit or submit an appeal.' },
                  { q: 'Can I stay anonymous?', a: 'Yes. You can enable the anonymous option when creating your petition. Your legal identity is kept securely on our servers but is never shown publicly.' },
                  { q: 'What if the authority does not respond?', a: 'Silence is documented. The petition page will show "No response received" as a public record. This itself can generate media and political pressure.' },
                  { q: 'Can I petition for anything?', a: 'No. Petitions must be civic issues — infrastructure, health, education, governance, environment, rights, etc. Personal disputes, commercial claims, and defamatory content are not allowed.' },
                ].map((f) => (
                  <div
                    key={f.q}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-neutral-50">{f.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{f.a}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* CTA */}
        <section className="px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            Your issue deserves to be heard.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600 dark:text-neutral-400">
            It takes under 3 minutes to start a petition. Start today.
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700"
          >
            Start a petition — it&apos;s free
            <span aria-hidden>→</span>
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
