import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Help Center — Change Liberia',
  description: 'Find answers to common questions about creating petitions, signing, verification, and using the Change Liberia platform.',
};

const CATEGORIES = [
  { icon: '🚀', title: 'Getting Started', desc: 'Create your first petition, understand the process, and set up your account.' },
  { icon: '✍️', title: 'Creating Petitions', desc: 'Best practices for writing your petition, adding media, and choosing the right category.' },
  { icon: '🖊️', title: 'Signing Petitions', desc: 'How to sign, what verification means, and why your signature counts.' },
  { icon: '🔐', title: 'Account & Verification', desc: 'Phone and ID verification, trust scores, and managing your profile.' },
  { icon: '📢', title: 'Sharing & Growth', desc: 'How to promote your petition, reach your signature goal, and engage supporters.' },
  { icon: '⚙️', title: 'Technical Help', desc: 'Troubleshooting login issues, page errors, and platform problems.' },
];

const FAQS = [
  {
    section: 'Getting Started',
    items: [
      {
        q: 'What is Change Liberia?',
        a: 'Change Liberia is a civic petition platform built for Liberians at home and in the diaspora. It lets any citizen raise a verifiable public issue, collect signatures, and have it formally delivered to the right government body — with a public accountability trail.',
      },
      {
        q: 'Do I need to create an account to use the platform?',
        a: 'You need a free account to create or sign a petition so your support can be verified. Browsing petitions is open to everyone without an account.',
      },
      {
        q: 'Is the platform free to use?',
        a: 'Yes. Creating a petition, signing one, and joining the movement are completely free. There are no fees at any stage.',
      },
    ],
  },
  {
    section: 'Creating Petitions',
    items: [
      {
        q: 'How do I start a petition?',
        a: 'Click "Start a petition" from any page. You\'ll go through a 5-step form: describe the issue, pick categories and a county, tell the full story, add media (optional), and set your identity preferences. Once submitted, your petition is reviewed by our team within 24-48 hours.',
      },
      {
        q: 'What happens after I submit my petition?',
        a: 'Your petition enters a review queue. Our moderation team checks it against community guidelines — usually within 24–48 hours. If approved, it goes live and you can begin collecting signatures. You will be notified of the decision.',
      },
      {
        q: 'Why was my petition rejected?',
        a: 'Common reasons include: personal attacks or defamatory content, no clear civic issue, spam or duplicate petitions, or insufficient description. You will receive a note explaining the reason. You can revise and resubmit.',
      },
      {
        q: 'Can I make my petition anonymous?',
        a: 'Yes. During creation you can enable the anonymity option. Your legal identity is still securely stored for verification purposes, but only a public display name (or "Anonymous") will be shown on the petition page.',
      },
    ],
  },
  {
    section: 'Signing Petitions',
    items: [
      {
        q: 'How do I sign a petition?',
        a: 'Open any petition page and click "Sign this petition" in the right panel. You will need to be logged in. Your verified identity adds weight to the signature count.',
      },
      {
        q: 'Can Liberians in the diaspora sign petitions?',
        a: 'Yes. Change Liberia welcomes signatures from all Liberians worldwide. Diaspora signatures are counted and labelled separately to give petitions full credibility.',
      },
      {
        q: 'What does "verified signature" mean?',
        a: 'A verified signature comes from an account that has completed at least phone number verification. Highly verified signatures (from users who also uploaded a national ID) carry more trust weight.',
      },
    ],
  },
  {
    section: 'Account & Verification',
    items: [
      {
        q: 'How does phone verification work?',
        a: 'Go to your Dashboard and click "Verify phone". Enter your Liberian or international number (e.g. +231 77 000 0000). You will receive a 6-digit SMS code. Enter it to verify. This adds 40 trust points to your account.',
      },
      {
        q: 'What is a trust score?',
        a: 'Your trust score is a number from 0–100 that reflects how verified your identity is. Higher trust scores make your signatures carry more credibility. You earn points by verifying your phone, uploading a national ID, and signing in from Liberia.',
      },
      {
        q: 'Is my personal data safe?',
        a: 'Yes. We store identity data securely and encrypted. We never sell or share your data with third parties. Data is only disclosed under a lawful Liberian court order. See our Privacy Policy for full details.',
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">

        {/* Hero */}
        <section className="bg-emerald-700 px-4 py-20 text-center dark:bg-emerald-900">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Support</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">Help Center</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100 sm:text-lg">
            Everything you need to create petitions, gather support, and understand how Change Liberia works.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow hover:bg-emerald-50"
            >
              Start a petition
            </Link>
            <Link
              href="mailto:hello@changelib.org"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Email support
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Browse by topic
          </p>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            How can we help?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">
                  {c.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-neutral-50">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Common questions
            </p>
            <h2 className="mt-3 text-center text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              Frequently asked questions
            </h2>

            <div className="mt-10 space-y-10">
              {FAQS.map((section) => (
                <div key={section.section}>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    {section.section}
                  </h3>
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div
                        key={item.q}
                        className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        <p className="font-semibold text-zinc-900 dark:text-neutral-50">{item.q}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still need help */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Still stuck?
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              Contact our support team
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-zinc-600 dark:text-neutral-400">
              We typically respond within one business day. For urgent matters — including abuse reports — mark your subject line URGENT.
            </p>
            <div className="mt-6 space-y-2 text-sm font-medium text-zinc-700 dark:text-neutral-300">
              <p>
                Email:{' '}
                <a href="mailto:hello@changelib.org" className="text-emerald-600 underline dark:text-emerald-400">
                  hello@changelib.org
                </a>
              </p>
              <p>WhatsApp: +231 77 000 0000</p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/community-guidelines"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                Community guidelines
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                How it works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
