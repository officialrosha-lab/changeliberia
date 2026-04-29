import Link from 'next/link';

export const metadata = { title: 'Privacy Settings — Change Liberia' };

const settings = [
  {
    title: 'Public profile',
    desc: 'Allow others to see your name and petition activity on public pages.',
    defaultOn: true,
  },
  {
    title: 'Show signature count',
    desc: 'Display how many petitions you have signed on your public profile.',
    defaultOn: true,
  },
  {
    title: 'Allow petition creators to contact you',
    desc: 'Petition creators can send you updates about campaigns you have signed.',
    defaultOn: true,
  },
  {
    title: 'Marketing emails',
    desc: 'Receive occasional emails about new petitions and platform updates.',
    defaultOn: false,
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white">
          ← Settings
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Privacy Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Control how your information is used and who can see your activity.
        </p>

        <div className="mt-6 space-y-4">
          {settings.map((s) => (
            <div key={s.title} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-neutral-100">{s.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-400">{s.desc}</p>
              </div>
              <div
                className={`mt-0.5 h-5 w-9 flex-shrink-0 cursor-not-allowed rounded-full transition ${s.defaultOn ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-neutral-600'}`}
                title="Coming soon"
              >
                <div className={`mt-0.5 h-4 w-4 translate-y-0 rounded-full bg-white shadow transition-transform ${s.defaultOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Coming soon</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Fine-grained privacy controls are under development. The settings above show your default preferences.
          </p>
        </div>

        <Link
          href="/settings"
          className="mt-6 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Back to Settings
        </Link>
      </div>
    </main>
  );
}
