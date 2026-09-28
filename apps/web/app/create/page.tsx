import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CreatePetitionForm } from './create-form';
import { Card } from '../../components/ui/card';

export const metadata: Metadata = {
  title: 'Start a Petition — Change Liberia',
  description: 'Write and publish a petition on the issue that matters to your community, and start gathering verified support.',
  alternates: { canonical: '/create' },
};

export default function CreatePetitionPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <Card rounded="3xl" className="p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              Petition drafting
            </p>
            <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-neutral-50 md:text-4xl">
              Start a petition
            </h1>
            <Suspense fallback={<p className="mt-4 text-zinc-500 dark:text-neutral-500">Loading…</p>}>
              <CreatePetitionForm />
            </Suspense>
          </Card>
        </section>
        <aside className="space-y-4">
          <Card rounded="3xl" className="p-5 shadow-sm">
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
          </Card>
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
