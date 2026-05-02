import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead Change in Your Community | Change Liberia',
  description: 'Become a Change Leader and amplify voices in your community. Guide petitions, mentor organizers, and drive real civic change across Liberia.',
};

export default function LeadersPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              🇱🇷 For Every Community
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              Lead Change in Your Community
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Become a Change Leader and amplify the voices of your community. Guide civic petitions, mentor organizers, and help drive real change — from ward to county level.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Get Started as a Leader
              </Link>
              <Link
                href="/petitions"
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-600 px-8 py-3 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                Browse Active Petitions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What Is a Change Leader */}
      <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                What Is a Change Leader?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                A Change Leader is a trusted community advocate who empowers others to drive civic change. Whether you're a teacher, trader, chief, youth leader, or activist — if you believe in Liberian progress, you can lead.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                Change Leaders help their communities by:
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Identifying local issues that matter most',
                  'Guiding community members to start petitions',
                  'Mobilizing verified support within your network',
                  'Mentoring peer organizers',
                  'Connecting decision-makers with communities',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-zinc-600 dark:text-neutral-300">
                    <span className="mt-1 flex-shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-8 dark:from-emerald-900/30 dark:to-emerald-800/10">
              <div className="text-center">
                <p className="text-5xl">👥</p>
                <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Every leader strengthens the movement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-neutral-300">
            Becoming a Change Leader is simple. Here's your journey:
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description:
                  'Create your account on Change Liberia and verify your identity. Leaders are trusted community voices.',
                icon: '📝',
              },
              {
                step: '2',
                title: 'Choose Your Cause',
                description:
                  'Select the issues you care about — education, infrastructure, health, governance, or any civic concern.',
                icon: '🎯',
              },
              {
                step: '3',
                title: 'Build Your Community',
                description:
                  'Share petitions, guide supporters, and mentor organizers. Your leadership drives real change.',
                icon: '🤝',
              },
              {
                step: '4',
                title: 'Drive Impact',
                description:
                  'Watch your community mobilize. Reach decision-makers and celebrate wins together.',
                icon: '🚀',
              },
              {
                step: '5',
                title: 'Earn Recognition',
                description:
                  'Get badges, impact reports, and community appreciation for your leadership.',
                icon: '⭐',
              },
              {
                step: '6',
                title: 'Grow the Movement',
                description:
                  'Mentor new leaders, expand to new areas, and help other communities find their voice.',
                icon: '📈',
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leader Benefits */}
      <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Why Become a Change Leader?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                title: 'Amplify Your Voice',
                description: 'Your leadership reaches beyond your immediate circle. Influence civic change at scale.',
              },
              {
                title: 'Build Community Trust',
                description: 'Earn verified badges and recognition as a trusted community advocate.',
              },
              {
                title: 'Access Tools & Resources',
                description:
                  'Get exclusive leader dashboard, templates, guides, and direct support from our team.',
              },
              {
                title: 'Connect with Decision-Makers',
                description:
                  'Help bridge communities and leaders. Your petitions get priority attention.',
              },
              {
                title: 'Mentorship Opportunities',
                description:
                  'Guide the next generation of civic organizers and build leadership pipelines.',
              },
              {
                title: 'Impact Reports',
                description:
                  'Track real change. See metrics on community mobilization, petition success, and lives improved.',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-neutral-900">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types of Leaders */}
      <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
            All Kinds of Leaders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-neutral-300">
            Change Leaders come from every walk of life. Here are some examples:
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: '👨‍🏫', title: 'Teachers', desc: 'Champion education reform and youth voices' },
              { emoji: '👩‍⚕️', title: 'Healthcare Workers', desc: 'Advocate for health access and wellness' },
              { emoji: '🧑‍🌾', title: 'Farmers & Traders', desc: 'Drive agricultural and economic change' },
              { emoji: '👩‍💼', title: 'Business Owners', desc: 'Lead workplace and economic empowerment' },
              { emoji: '🧑‍💻', title: 'Youth Organizers', desc: 'Mobilize young people for civic action' },
              { emoji: '👩‍⚖️', title: 'Community Advocates', desc: 'Champion justice and governance reform' },
            ].map((leader, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-4xl">{leader.emoji}</p>
                <h3 className="mt-3 font-semibold text-zinc-900 dark:text-white">{leader.title}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">{leader.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 text-center dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-neutral-900 sm:p-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Ready to Lead Change?
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-neutral-300">
            Join thousands of Liberian leaders who are already driving civic change. Start today — it's free.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Become a Change Leader
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border-2 border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              Learn More About Change Liberia
            </Link>
          </div>
          <p className="mt-6 text-xs text-zinc-500 dark:text-neutral-500">
            No credit card required. Sign up takes less than 2 minutes.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-6">
            {[
              {
                q: 'Do I need any special qualifications?',
                a: 'No. If you care about your community and want to drive change, you can be a Change Leader. We provide all the tools and training you need.',
              },
              {
                q: 'Is there a cost?',
                a: 'No. Becoming a Change Leader is completely free. Change Liberia is built for every Liberian.',
              },
              {
                q: 'How much time do I need to commit?',
                a: 'As much or as little as you want. Some leaders spend a few hours a week; others dedicate more time. You control your schedule.',
              },
              {
                q: 'What if I want to represent multiple areas?',
                a: 'Absolutely. Many leaders cover their community, county, or even multiple counties. You can expand your reach as you grow.',
              },
              {
                q: 'How do you verify leaders?',
                a: 'We use ID verification, community feedback, and our trust score system to ensure leaders are authentic and trustworthy.',
              },
              {
                q: 'Can I change causes or areas?',
                a: 'Yes. Leaders can pivot at any time. Your leadership journey evolves with your community's needs.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{faq.q}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
