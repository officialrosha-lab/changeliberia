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
  const token = useAuthStore((s) => s.token);
  const [phase, setPhase] = useState<Phase>('loading');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPhase('denied');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await apiGet<{ role: string }>('/users/me', token);
        if (cancelled) return;
        if (me.role !== 'ADMIN') {
          setPhase('denied');
          setLoading(false);
          return;
        }
        setPhase('ok');
        const response = await apiGet<SubmissionsResponse>('/government/submissions', token);
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
  }, [token]);

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Checking access…
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-700">Access denied</h1>
          <p className="mt-3 text-red-600">
            This page requires an Admin account.{' '}
            {!token && (
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
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Government submissions</h1>
            <p className="mt-2 text-sm text-zinc-600">Track the status of petitions you have submitted to government or NGO contacts.</p>
          </div>
          <Link href="/dashboard" className="inline-flex rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-zinc-50 p-8 text-center text-zinc-500">Loading submissions…</div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : submissions.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
            <p className="text-lg font-semibold text-zinc-900">No submissions found</p>
            <p className="mt-2 text-sm text-zinc-600">Once you submit a petition, it will appear here with its government review status.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <Link href={`/petitions/${submission.petition.id}`} className="text-xl font-semibold text-zinc-900 hover:text-emerald-700 break-words">
                      {submission.petition.title}
                    </Link>
                    <p className="mt-2 text-sm text-zinc-500 break-words">Submitted to {submission.governmentEmail}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div className="rounded-2xl bg-white p-3 text-zinc-700">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Status</p>
                      <p className="mt-2 font-semibold text-zinc-900">{submission.status}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-zinc-700">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Submitted</p>
                      <p className="mt-2 font-semibold text-zinc-900">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-zinc-700">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Updated</p>
                      <p className="mt-2 font-semibold text-zinc-900">{new Date(submission.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3 text-sm text-zinc-600">
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
