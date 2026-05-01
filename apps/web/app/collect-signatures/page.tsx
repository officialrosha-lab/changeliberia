import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '../../components/site-footer';

export const metadata: Metadata = {
  title: 'Collect Signatures — Change Liberia',
  description: 'Learn how to grow your petition, reach your signature goal, and turn citizen support into real government action on Change Liberia.',
};

const STEPS = [
  {
    step: '01',
    icon: '📝',
    title: 'Write a compelling petition',
    body: 'A clear title, honest summary, and detailed description make people want to sign. Explain exactly what the problem is, who is responsible, and what specific action you are asking for. Petitions with a strong "why" collect three times more signatures.',
    tip: 'Include personal testimony. "This road has injured 12 schoolchildren this year" is more powerful than "the road is bad."',
  },
  {
    step: '02',
    icon: '📸',
    title: 'Add photos or video',
    body: 'Visual evidence makes your petition more credible and shareable. Add a cover image that shows the issue — a damaged road, a flooded community, an overcrowded clinic. Videos embedded from YouTube work too.',
    tip: 'A real photo you took yourself always beats a stock image.',
  },
  {
    step: '03',
    icon: '📱',
    title: 'Share on WhatsApp first',
    body: 'WhatsApp is the fastest way to reach Liberians. Share the petition link in your community groups, family chats, and church groups. A personal message ("I submitted this petition — please sign and share") gets far more responses than a bare link.',
    tip: 'Send to 5 people who you know will sign, then ask each of them to share it with 5 more.',
  },
  {
    step: '04',
    icon: '📲',
    title: 'Post on Facebook and other social media',
    body: 'Copy the petition link and share it on Facebook with a short caption explaining the issue. Tag local community pages, journalists, NGOs, and civil society organisations that care about the topic. Public posts spread faster than private shares.',
    tip: 'Post updates when you hit milestones — "We reached 500 signatures!" drives a second wave of shares.',
  },
  {
    step: '05',
    icon: '🤝',
    title: 'Engage community leaders',
    body: 'Contact local chiefs, pastors, community union leaders, women\'s groups, and student associations. Ask them to sign and encourage their networks. A single endorsement from a respected community leader can unlock hundreds of signatures.',
    tip: 'Brief them clearly: "This affects our community because..." — make it personal to their constituency.',
  },
  {
    step: '06',
    icon: '📰',
    title: 'Reach out to media',
    body: 'Send your petition link to radio stations, newspapers, and online news sites that cover Liberian civic issues. Journalists are looking for stories with verified public support. A petition with 1,000 signatures is a credible news story.',
    tip: 'Keep your media pitch to three sentences: the problem, why it matters now, and the link.',
  },
];

const MILESTONES = [
  { count: '100', label: 'Building momentum', body: 'Your petition is gaining traction. Share an update on the petition page to keep supporters engaged and encourage them to keep sharing.' },
  { count: '500', label: 'Visible credibility', body: 'Half a thousand verified Liberians backing your cause makes this hard to ignore. The petition may be surfaced on the Change Liberia home page.' },
  { count: '1,000', label: 'Default goal reached', body: 'The standard goal on Change Liberia. At this point your petition is eligible to be formally submitted to the relevant authority through our government routing system.' },
  { count: '5,000+', label: 'National attention', body: 'Petitions at this scale attract national media coverage and political attention. This is the level that prompts cabinet-level responses.' },
];

const TIPS = [
  { icon: '⏰', title: 'Post at the right time', body: 'Evenings (7–9 PM GMT) and Sundays get the most engagement from Liberians on social media.' },
  { icon: '🔄', title: 'Post regular updates', body: 'Use the Updates section of your petition to share progress. Supporters get notified and often share again.' },
  { icon: '💬', title: 'Respond to comments', body: 'Engaging with supporters and questions in the comments section builds trust and keeps the petition alive in feeds.' },
  { icon: '🌍', title: 'Reach the diaspora', body: 'Liberians in the USA, Ghana, UK, and Côte d\'Ivoire are active on social media. Their signatures are counted separately but add significant credibility.' },
];

export default function CollectSignaturesPage() {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">

        {/* Hero */}
        <section className="bg-emerald-700 px-4 py-20 text-center dark:bg-emerald-900">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Grow your petition</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">Collect Signatures</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100 sm:text-lg">
            A petition with no signatures changes nothing. Here is exactly how to get the support your issue deserves.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow hover:bg-emerald-50"
            >
              Start a petition
            </Link>
            <Link
              href="/petitions"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse petitions
            </Link>
          </div>
        </section>

        {/* Why signatures matter */}
        <section className="mx-auto max-w-3xl px-4 py-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Why it matters</p>
          <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            Signatures are evidence, not decoration
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
            When Change Liberia delivers a petition to a government authority, the number and quality of verified signatures is the first thing they see. Every verified signature from a real Liberian citizen adds legal and political weight to your cause. The more you have, the harder it is to ignore.
          </p>
        </section>

        {/* Step-by-step guide */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Step-by-step</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              How to grow your signature count
            </h2>
            <div className="mt-10 space-y-8">
              {STEPS.map((s) => (
                <div key={s.step} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {s.step}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="font-bold text-zinc-900 dark:text-neutral-50">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{s.body}</p>
                    <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-950/50">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        💡 Pro tip: {s.tip}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Progress markers</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              What happens at each milestone
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {MILESTONES.map((m) => (
                <div
                  key={m.count}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {m.count}
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
                    {m.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick tips */}
        <section className="bg-zinc-50 px-4 py-16 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Quick wins</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              Tips that make a real difference
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TIPS.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-neutral-50">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What happens after goal */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">After you hit your goal</p>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
              From signatures to action
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-neutral-400">
              <p>
                Once your petition reaches its signature goal, the Change Liberia team reviews it for delivery. We identify the right authority based on the issue type — a national ministry, county government, the legislature, or a regulatory agency.
              </p>
              <p>
                The petition is then formally submitted with a delivery receipt and a request for a public response within 30 days. The entire process is recorded on your petition&apos;s timeline, visible to all supporters.
              </p>
              <p>
                If the authority responds, we publish it alongside the petition. If they do not respond within the deadline, that silence is also publicly recorded. Either way, you have created a permanent, verifiable public record of your civic action.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-emerald-700 px-4 py-16 text-center dark:bg-emerald-900">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to make your voice count?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-emerald-100">
            Every change starts with one person who cared enough to start. Your petition could be the one that moves Liberia forward.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow hover:bg-emerald-50"
            >
              Start a petition — it&apos;s free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              How it works
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
