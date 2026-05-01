import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Community Guidelines — Change Liberia',
  description: 'The rules and standards that keep Change Liberia a trustworthy, safe, and effective civic platform for all Liberians.',
};

const ALLOWED = [
  { icon: '✅', title: 'Genuine civic grievances', body: 'Petitions about government policy, public services, infrastructure, healthcare, education, environment, corruption, or any legitimate public-interest issue.' },
  { icon: '✅', title: 'Community and social causes', body: 'Campaigns addressing community safety, cultural preservation, youth welfare, disability rights, women\'s rights, and other civil society concerns.' },
  { icon: '✅', title: 'Verified, factual claims', body: 'Issues supported by documented evidence, personal testimony, or publicly available facts. You do not need to prove everything upfront — but claims must be made in good faith.' },
  { icon: '✅', title: 'Constructive criticism of institutions', body: 'Holding government bodies, agencies, and public officials accountable for decisions made in their official capacity. Critique the policy or action, not the person.' },
  { icon: '✅', title: 'Diaspora participation', body: 'Liberians living abroad may create and sign petitions. Their connection to Liberia is a legitimate basis for civic engagement.' },
];

const NOT_ALLOWED = [
  { icon: '🚫', title: 'Personal attacks and harassment', body: 'Petitions targeting private individuals with hateful, threatening, or defamatory language. Naming public officials for their official actions is permitted; targeting them personally is not.' },
  { icon: '🚫', title: 'Misinformation and fabricated claims', body: 'Deliberate falsehoods, manipulated documents, or verifiably false statistics presented as fact. We review flagged petitions and remove confirmed misinformation.' },
  { icon: '🚫', title: 'Spam and duplicate campaigns', body: 'Submitting multiple petitions on the same issue to game signature counts, or submitting empty or nonsensical petitions.' },
  { icon: '🚫', title: 'Content promoting violence or discrimination', body: 'Any petition that calls for violence, incites ethnic hatred, promotes discrimination based on tribe, religion, gender, disability, or sexual orientation.' },
  { icon: '🚫', title: 'Commercial and electoral content', body: 'Petitions designed to promote a business, product, or service. Petitions explicitly endorsing or opposing a political party candidate rather than a policy.' },
  { icon: '🚫', title: 'Private or sensitive information', body: 'Publishing private personal data (phone numbers, home addresses, financial records) of individuals without their consent — even if the subject is a public figure.' },
];

const STANDARDS = [
  { step: '01', title: 'Clear issue statement', body: 'The petition title and summary must state the problem plainly. Vague or misleading titles will be sent back for revision.' },
  { step: '02', title: 'Sufficient description', body: 'Petitions need enough context for a reader to understand the issue, who is responsible, and what specific action is being requested.' },
  { step: '03', title: 'Identified target', body: 'A good petition names the institution or authority best placed to act on the issue — a ministry, county authority, government agency, or legislature.' },
  { step: '04', title: 'Constructive ask', body: 'The requested action must be specific, realistic, and constructive. "Fix the road on Route 1 between Gbarnga and Ganta" is better than "fix all roads".' },
];

const VIOLATIONS = [
  { level: 'Warning', color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300', body: 'First-time minor violations receive a warning and a request to revise the content.' },
  { level: 'Content removal', color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300', body: 'Petitions that violate guidelines are taken down. The creator is notified with the reason.' },
  { level: 'Account suspension', color: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300', body: 'Repeated or serious violations — including targeted harassment or deliberate misinformation — result in temporary or permanent account suspension.' },
];

export default function CommunityGuidelinesPage() {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">

        {/* Hero */}
        <section className="bg-emerald-700 px-4 py-20 text-center dark:bg-emerald-900">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Platform standards</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">Community Guidelines</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100 sm:text-lg">
            Change Liberia is a space for honest, constructive civic action. These guidelines keep it trustworthy for everyone.
          </p>
          <p className="mt-3 text-xs text-emerald-300">Last updated: May 2026</p>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-3xl px-4 py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Our commitment</p>
          <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            A platform built on trust
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
            <p>
              Change Liberia works because citizens, government bodies, and civil society trust what happens here. Every petition that goes to a minister, a county superintendent, or a legislature carries the reputation of this platform behind it.
            </p>
            <p>
              That means we hold content to a real standard. We review every petition before it goes live. We investigate reports of abuse. And we remove content that breaks these guidelines — regardless of who submitted it or how popular it becomes.
            </p>
            <p>
              These guidelines are not designed to suppress legitimate dissent. If you have a real civic grievance, Change Liberia is here for you. These rules exist to protect that space from misuse.
            </p>
          </div>
        </section>

        {/* What's allowed */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Permitted content</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">What is allowed</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ALLOWED.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-emerald-900/50 dark:bg-neutral-800"
                >
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-neutral-50">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's NOT allowed */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 dark:text-red-400">Prohibited content</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">What is not allowed</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NOT_ALLOWED.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-red-100 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-neutral-800"
                >
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-neutral-50">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Petition quality standards */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Quality bar</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              What makes a strong petition
            </h2>
            <p className="mt-3 text-base text-zinc-600 dark:text-neutral-400">
              Meeting these standards improves your petition&apos;s chances of approval and increases its credibility with decision-makers.
            </p>
            <div className="mt-10 space-y-6">
              {STANDARDS.map((s) => (
                <div key={s.step} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {s.step}
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-zinc-900 dark:text-neutral-50">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consequences */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Enforcement</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              Consequences for violations
            </h2>
            <p className="mt-3 text-base text-zinc-600 dark:text-neutral-400">
              Violations are assessed on severity and pattern. We aim to be fair and transparent about every enforcement action.
            </p>
            <div className="mt-8 space-y-4">
              {VIOLATIONS.map((v) => (
                <div key={v.level} className={`rounded-2xl border p-5 ${v.color}`}>
                  <p className="font-bold">{v.level}</p>
                  <p className="mt-1 text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reporting */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Stay safe</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">Report abuse</h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
              If you see a petition or comment that violates these guidelines, report it immediately. Use the report button on the content, or contact us directly. All reports are reviewed within 24 hours. Reporters remain anonymous.
            </p>
            <div className="mt-6 space-y-2 text-sm font-medium text-zinc-700 dark:text-neutral-300">
              <p>
                Email:{' '}
                <a href="mailto:hello@changelib.org" className="text-emerald-600 underline dark:text-emerald-400">
                  hello@changelib.org
                </a>
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/help-center"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Help center
              </Link>
              <Link
                href="/create"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700"
              >
                Start a petition
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
