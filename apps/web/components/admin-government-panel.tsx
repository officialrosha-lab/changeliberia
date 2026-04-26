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
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Government submission monitoring</h2>
            <p className="mt-1 text-sm text-zinc-600">View platform-wide submission counts and update petition delivery state.</p>
          </div>
        </div>

        {loadingStats ? (
          <p className="mt-4 text-sm text-zinc-500">Loading government submission stats…</p>
        ) : stats ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total submissions</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{stats.totalSubmissions}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Approved</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-900">{stats.approved}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Under review</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">{stats.underReview}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Lookup petition status</h2>
            <p className="mt-1 text-sm text-zinc-600">Enter a petition ID to inspect submission history and update its current state.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1.5fr_0.5fr]">
          <input
            value={petitionId}
            onChange={(e) => setPetitionId(e.target.value)}
            placeholder="Petition ID"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Current status</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">{statusResponse.status}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Submitted</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">{statusResponse.submitted ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Updated</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">{statusResponse.updatedAt ? new Date(statusResponse.updatedAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Set new status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SubmissionStatus)}
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Update status'}
                </button>
              </div>
            </div>

            {statusResponse.submissions?.length ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">Submission history</h3>
                <div className="mt-4 space-y-3">
                  {statusResponse.submissions.map((submission) => (
                    <div key={submission.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 break-words">{submission.governmentEmail}</p>
                          <p className="text-sm text-zinc-500">{submission.status}</p>
                        </div>
                        <div className="text-right text-sm text-zinc-500">
                          <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                          <p>Updated {new Date(submission.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-zinc-600">
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
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}
      </section>
    </div>
  );
}
