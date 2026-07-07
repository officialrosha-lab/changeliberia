'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface PendingOfficial {
  id: string;
  name: string;
  category: string;
  county: string | null;
  district: string | null;
  officialEmail: string;
  holderUser: { id: string; fullName: string; email: string | null; phone: string } | null;
  officialProfile: { bio: string | null; verificationDocUrl: string | null } | null;
}

export function AdminOfficialsVerificationPanel() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<PendingOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiGet<PendingOfficial[]>('/admin/officials/pending', token);
      setRows(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load pending applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function approve(id: string) {
    if (!token) return;
    setBusyId(id);
    setActionError(null);
    try {
      await apiPatch(`/admin/officials/${id}/approve`, {}, token);
      setRows((r) => r.filter((row) => row.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!token) return;
    setBusyId(id);
    setActionError(null);
    try {
      await apiPatch(`/admin/officials/${id}/reject`, { notes: notes[id] }, token);
      setRows((r) => r.filter((row) => row.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading pending official applications…</p>;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
        <button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">
        Pending official verifications
      </h2>
      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}
      {rows.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">No pending applications.</p>
      )}
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-neutral-50 break-words">{row.name}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                {row.category.replaceAll('_', ' ')}
                {row.county ? ` · ${row.county}` : ''}
                {row.district ? ` · District ${row.district}` : ''}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">{row.officialEmail}</p>
              {row.holderUser && (
                <p className="mt-1 text-xs text-zinc-400">
                  Applicant: {row.holderUser.fullName} ({row.holderUser.email ?? row.holderUser.phone})
                </p>
              )}
              {row.officialProfile?.verificationDocUrl && (
                <a
                  href={row.officialProfile.verificationDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-emerald-600 underline"
                >
                  View verification document
                </a>
              )}
            </div>
          </div>

          <textarea
            placeholder="Rejection notes (optional)"
            value={notes[row.id] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
            className="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-900"
            rows={2}
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => approve(row.id)}
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => reject(row.id)}
              className="inline-flex items-center rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
