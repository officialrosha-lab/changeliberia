import { Metadata } from 'next';
import { AmbassadorApplicationForm } from '../../components/ambassador-application-form';

export const metadata: Metadata = {
  title: "Become a Voice for Change | Change Liberia",
  description: "Apply to become an Ambassador and represent your community. Help drive civic change across Liberia.",
};

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              🇱🇷 Help Lead Change
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Become a Voice for Change
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Ambassadors represent their communities and help drive civic change. If you're passionate about Liberia's future, we want to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
            Why Become an Ambassador?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: '📢',
                title: 'Spread Awareness',
                description: 'Help your community know about issues that matter and empower them to take action.',
              },
              {
                icon: '📋',
                title: 'Drive Petitions',
                description: 'Support campaigns that matter to you and help move them from idea to impact.',
              },
              {
                icon: '🤝',
                title: 'Represent Your Community',
                description: 'Be the voice of your ward, town, or county and make real change happen.',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <p className="text-4xl">{benefit.icon}</p>
                <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 sm:p-10">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Apply Now</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">
              Share your story and let us know why you want to be a Voice for Change.
            </p>
            <div className="mt-8">
              <AmbassadorApplicationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
            Questions?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                q: 'How long does review take?',
                a: 'Applications are typically reviewed within 7-10 business days.',
              },
              {
                q: 'What if my application is rejected?',
                a: "We'll send feedback. You can reapply after addressing our suggestions.",
              },
              {
                q: 'Do I need to live in Liberia?',
                a: 'We welcome Liberians both in-country and diaspora who want to drive change.',
              },
              {
                q: 'What happens after approval?',
                a: 'You\'ll get access to ambassador tools, training, and your own dashboard.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
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
