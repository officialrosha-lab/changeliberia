'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

type SubmissionStatus = 'SUBMITTED' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EMAIL_FAILED' | 'NOT_SUBMITTED';

type SubmissionRecord = {
  id: string;
  governmentEmail: string;
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  notes?: string | null;
  responseNotes?: string | null;
  signatureCount?: number | null;
};

type StatusResponse = {
  petitionId: string;
  submitted: boolean;
  status: SubmissionStatus;
  submittedAt?: string;
  updatedAt?: string;
  submissions?: SubmissionRecord[];
};

type StatsResponse = {
  totalSubmissions: number;
  submitted: number;
  acknowledged: number;
  underReview: number;
  approved: number;
  rejected: number;
};

const STATUS_OPTIONS: SubmissionStatus[] = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

export function AdminGovernmentPanel() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [petitionId, setPetitionId] = useState('');
  const [statusResponse, setStatusResponse] = useState<StatusResponse | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus>('SUBMITTED');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadingStats(true);

    void (async () => {
      try {
        const response = await apiGet<StatsResponse>('/government/stats', token);
        if (!cancelled) setStats(response);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load government stats');
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function loadStatus() {
    if (!token || !petitionId.trim()) {
      setError('Enter a petition ID first.');
      return;
    }
    setLoadingStatus(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiGet<StatusResponse>(`/government/status/${petitionId.trim()}`, token);
      setStatusResponse(response);
      setSelectedStatus(response.status === 'NOT_SUBMITTED' ? 'SUBMITTED' : response.status);
    } catch (err) {
      setStatusResponse(null);
      setError(err instanceof Error ? err.message : 'Failed to load petition status');
    } finally {
      setLoadingStatus(false);
    }
  }

  async function updateStatus() {
    if (!token || !petitionId.trim()) {
      setError('Enter a petition ID before saving status.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiPost<{ success: boolean; message: string }>(
        `/government/status/${petitionId.trim()}`,
        { status: selectedStatus },
        token,
      );
      setMessage(response.message || 'Submission status updated successfully.');
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Government submission monitoring</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">View platform-wide submission counts and update petition delivery state.</p>
          </div>
        </div>

        {loadingStats ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-neutral-400">Loading government submission stats…</p>
        ) : stats ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-zinc-100 p-4 dark:bg-neutral-800">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Total submissions</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-neutral-50">{stats.totalSubmissions}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Approved</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-emerald-300">{stats.approved}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 dark:bg-amber-950">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700 dark:text-amber-400">Under review</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900 dark:text-amber-300">{stats.underReview}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Lookup petition status</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">Enter a petition ID to inspect submission history and update its current state.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1.5fr_0.5fr]">
          <input
            value={petitionId}
            onChange={(e) => setPetitionId(e.target.value)}
            placeholder="Petition ID"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder-neutral-500 dark:focus:ring-emerald-800"
          />
          <button
            type="button"
            onClick={loadStatus}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {loadingStatus ? 'Loading…' : 'Load status'}
          </button>
        </div>

        {statusResponse ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Current status</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">{statusResponse.status}</p>
              </div>
              <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Submitted</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">{statusResponse.submitted ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-neutral-400">Updated</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-neutral-50">{statusResponse.updatedAt ? new Date(statusResponse.updatedAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300">Set new status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SubmissionStatus)}
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:focus:ring-emerald-800"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={updateStatus}
                  disabled={saving}
                  className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                >
                  {saving ? 'Saving…' : 'Update status'}
                </button>
              </div>
            </div>

            {statusResponse.submissions?.length ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50">Submission history</h3>
                <div className="mt-4 space-y-3">
                  {statusResponse.submissions.map((submission) => (
                    <div key={submission.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 break-words dark:text-neutral-50">{submission.governmentEmail}</p>
                          <p className="text-sm text-zinc-500 dark:text-neutral-400">{submission.status}</p>
                        </div>
                        <div className="text-right text-sm text-zinc-500 dark:text-neutral-400">
                          <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                          <p>Updated {new Date(submission.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-zinc-600 dark:text-neutral-400">
                        <p>Signatures: {submission.signatureCount ?? 'N/A'}</p>
                        <p>Notes: {submission.notes || '—'}</p>
                        <p>Response notes: {submission.responseNotes || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">{message}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
        ) : null}
      </section>
    </div>
  );
}
