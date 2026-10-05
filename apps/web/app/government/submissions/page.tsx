'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

type SubmissionRecord = {
  id: string;
  governmentEmail: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  notes?: string | null;
  responseNotes?: string | null;
  signatureCount?: number | null;
  petition: {
    id: string;
    title: string;
  };
};

type SubmissionsResponse = {
  success: boolean;
  count: number;
  submissions: SubmissionRecord[];
};

type Phase = 'loading' | 'denied' | 'ok';

export default function GovernmentSubmissionsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [phase, setPhase] = useState<Phase>('loading');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPhase('denied');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await apiGet<{ role: string }>('/users/me');
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          setPhase('denied');
          setLoading(false);
          return;
        }
        setPhase('ok');
        const response = await apiGet<SubmissionsResponse>('/government/submissions');
        if (!cancelled) {
          setSubmissions(response.submissions || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load government submissions');
          setPhase('ok');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500 dark:text-neutral-400">
        Checking access…
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">Access denied</h1>
          <p className="mt-3 text-red-600 dark:text-red-400">
            This page requires an Admin account.{' '}
            {!isAuthenticated && (
              <Link href="/auth/login" className="font-semibold underline">
                Sign in
              </Link>
            )}
          </p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Government submissions</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-300">Track the status of petitions you have submitted to government or NGO contacts.</p>
          </div>
          <Link href="/dashboard" className="inline-flex rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-zinc-50 p-8 text-center text-zinc-500 dark:bg-neutral-800 dark:text-neutral-400">Loading submissions…</div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
        ) : submissions.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">No submissions found</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-300">Once you submit a petition, it will appear here with its government review status.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-neutral-800 dark:bg-neutral-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <Link href={`/petitions/${submission.petition.id}`} className="text-xl font-semibold text-zinc-900 hover:text-emerald-700 break-words dark:text-white dark:hover:text-emerald-400">
                      {submission.petition.title}
                    </Link>
                    <p className="mt-2 text-sm text-zinc-500 break-words dark:text-neutral-400">Submitted to {submission.governmentEmail}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div className="rounded-2xl bg-white p-3 text-zinc-700 dark:bg-neutral-900 dark:text-neutral-200">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Status</p>
                      <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{submission.status}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-zinc-700 dark:bg-neutral-900 dark:text-neutral-200">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Submitted</p>
                      <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-zinc-700 dark:bg-neutral-900 dark:text-neutral-200">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Updated</p>
                      <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{new Date(submission.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3 text-sm text-zinc-600 dark:text-neutral-300">
                  <p className="break-words">Signatures recorded: {submission.signatureCount ?? 'N/A'}</p>
                  <p className="break-words">Notes: {submission.notes || '—'}</p>
                  <p className="break-words">Response notes: {submission.responseNotes || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
