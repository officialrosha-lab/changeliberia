'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { PollSubmissionForm } from '../../components/poll-submission-form';
import { PollCard, type PollSummary } from '../../components/poll-card';

export default function CivicPulsePage() {
  const token = useAuthStore((s) => s.token);
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  async function fetchPolls() {
    const data = await apiGet<PollSummary[]>('/polls?status=APPROVED').catch(() => []);
    setPolls(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        await fetchPolls();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              Civic Pulse
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Active public sentiment polls
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Browse live polls shaping Liberia today, vote on public issues, and submit a poll idea for review.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/polls"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-600"
            >
              View all polls
            </Link>
            {token ? (
              <button
                onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {showSubmissionForm ? 'Cancel' : 'Submit Poll Idea'}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Sign in to submit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Poll Submission Form */}
      {showSubmissionForm && token && (
        <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Submit a Poll Idea</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Have a question for Liberia? Submit your idea below. It will be reviewed by our admin team and published once approved.
          </p>
          <PollSubmissionForm
            onSuccess={() => {
              setShowSubmissionForm(false);
              void fetchPolls();
            }}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900" />
          ))
        ) : polls.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-zinc-500 dark:text-zinc-400">No active polls right now. Check back soon or submit a poll idea.</p>
          </div>
        ) : (
          polls.map((poll) => <PollCard key={poll.id} poll={poll} />)
        )}
      </div>
    </main>
  );
}
