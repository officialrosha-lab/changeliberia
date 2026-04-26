import { Suspense } from 'react';
import { CreatePetitionForm } from './create-form';

export default function CreatePetitionPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              Petition drafting
            </p>
            <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-neutral-50 md:text-4xl">
              Start a petition
            </h1>
            <Suspense fallback={<p className="mt-4 text-zinc-500 dark:text-neutral-500">Loading…</p>}>
              <CreatePetitionForm />
            </Suspense>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">What happens next</p>
            <ol className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-neutral-400">
              <li>
                <span className="font-semibold text-zinc-900 dark:text-neutral-100">1.</span> Describe the problem and
                the change you want.
              </li>
              <li>
                <span className="font-semibold text-zinc-900 dark:text-neutral-100">2.</span> Submit your petition for
                review so it can appear publicly.
              </li>
              <li>
                <span className="font-semibold text-zinc-900 dark:text-neutral-100">3.</span> Share it widely and post
                campaign updates from your dashboard.
              </li>
            </ol>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Tips for a stronger petition</p>
            <ul className="mt-3 space-y-2 text-sm text-emerald-900/80 dark:text-emerald-300/80">
              <li>Be specific about the place, institution, or official that must act.</li>
              <li>Explain who is affected and why the issue matters now.</li>
              <li>Use a photo only if it helps people understand the problem.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
