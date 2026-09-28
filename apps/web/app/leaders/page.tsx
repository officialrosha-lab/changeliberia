import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead change in your community | Change Liberia',
  description: 'Apply to become a Change Liberia ambassador — help your community raise issues, gather verified support, and get petitions in front of the people who can act on them.',
  alternates: { canonical: '/leaders' },
};

export default function LeadersPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              🇱🇷 For every community
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
              Lead change in your community
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Ambassadors are the people on the ground who turn a single complaint into a petition their whole community signs. If you already do this informally — for your ward, your market, your church, your county — apply to do it with our support behind you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Apply to become an ambassador
              </Link>
              <Link
                href="/petitions"
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-600 px-8 py-3 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                Browse active petitions
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
                What does an ambassador actually do?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                No title, no office — just someone their community trusts to turn a shared frustration into something official. Teachers, traders, chiefs, youth organizers, pastors: if people already come to you with problems, you&apos;re most of the way there.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
                In practice, that means:
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Helping neighbors turn a complaint into a well-written petition',
                  'Sharing petitions through your own network to gather verified signatures',
                  'Explaining how the process works to people signing for the first time',
                  'Flagging issues that matter to your community before they escalate',
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
                  Every ambassador strengthens the movement
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
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-neutral-300">
            Four steps, no bureaucracy.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Apply',
                description:
                  'Tell us about your community and why you want to represent it. Takes about five minutes.',
                icon: '📝',
              },
              {
                step: '2',
                title: 'Get reviewed',
                description:
                  'Our team reads every application personally — no automated approval, no quotas.',
                icon: '🔍',
              },
              {
                step: '3',
                title: 'Start organizing',
                description:
                  'Once approved, help your community raise issues, write petitions, and gather verified signatures.',
                icon: '🤝',
              },
              {
                step: '4',
                title: 'Track the outcome',
                description:
                  'Every petition you help launch is tracked publicly — including whether the responsible authority responded.',
                icon: '📊',
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
            Why apply?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                title: 'Real reach for your issues',
                description: 'Petitions you help launch are routed to the specific government body responsible — not a general inbox.',
              },
              {
                title: 'A public track record',
                description: 'Every petition you back is publicly tracked from submission to response, so your community can see exactly what happened.',
              },
              {
                title: 'Direct line to our team',
                description: 'Ambassadors can reach us directly with questions about moderation, routing, or how to frame a difficult petition.',
              },
              {
                title: 'Sharing badges, same as any signer',
                description: 'Sharing petitions in your network earns the same referral badges available to every user — ambassadors just tend to earn them faster.',
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
            Ambassadors come from everywhere
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-neutral-300">
            There&apos;s no fixed profile. Here&apos;s who&apos;s applied so far:
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: '👨‍🏫', title: 'Teachers', desc: 'Raising issues in education and youth affairs' },
              { emoji: '👩‍⚕️', title: 'Healthcare workers', desc: 'Advocating for clinic access and public health' },
              { emoji: '🧑‍🌾', title: 'Farmers and traders', desc: 'Pushing for market and agricultural reform' },
              { emoji: '👩‍💼', title: 'Business owners', desc: 'Organizing around local economic issues' },
              { emoji: '🧑‍💻', title: 'Youth organizers', desc: 'Mobilizing young people for civic action' },
              { emoji: '👩‍⚖️', title: 'Community advocates', desc: 'Championing justice and governance reform' },
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
            Ready to represent your community?
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-neutral-300">
            The application takes a few minutes. It&apos;s free, and every submission is read by a real person on our team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Apply now
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border-2 border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-95 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              Learn more about Change Liberia
            </Link>
          </div>
          <p className="mt-6 text-xs text-zinc-500 dark:text-neutral-500">
            No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-12 space-y-6">
            {[
              {
                q: 'Do I need any special qualifications?',
                a: "No. If your community already comes to you with problems, that's the qualification. We look for judgment and follow-through, not credentials.",
              },
              {
                q: 'Is there a cost?',
                a: 'No. Applying and organizing as an ambassador is completely free.',
              },
              {
                q: 'How much time do I need to commit?',
                a: "As much or as little as you want. There's no minimum — some ambassadors help with one petition a year, others help their community every week.",
              },
              {
                q: 'Can I represent more than one area?',
                a: "Yes. Tell us in your application, and mention it again if you'd like to expand later.",
              },
              {
                q: 'How are applications reviewed?',
                a: "A member of our team reads every application and, when needed, follows up by email or phone before making a decision.",
              },
              {
                q: 'What if I want to stop?',
                a: 'Nothing binds you. Ambassadors can step back at any time — you can keep signing and sharing petitions as anyone else does.',
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
