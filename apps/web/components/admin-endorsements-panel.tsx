'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface PendingEndorsement {
  id: string;
  endorserName: string;
  endorserTitle: string | null;
  endorserType: string;
  organization: string | null;
  statement: string | null;
  petition: { id: string; title: string };
}

export function AdminEndorsementsPanel() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<PendingEndorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PendingEndorsement[]>('/admin/endorsements/pending', token);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending endorsements');
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
    try {
      await apiPatch(`/admin/endorsements/${id}/approve`, {}, token);
      setRows((r) => r.filter((row) => row.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!token) return;
    setBusyId(id);
    try {
      await apiPatch(`/admin/endorsements/${id}/reject`, { notes: notes[id] }, token);
      setRows((r) => r.filter((row) => row.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading pending endorsements…</p>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Pending endorsements</h2>
      {rows.length === 0 && <p className="text-sm text-zinc-500 dark:text-neutral-400">No pending endorsements.</p>}
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-800">
          <p className="font-semibold text-zinc-900 dark:text-neutral-50">{row.endorserName}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            {[row.endorserTitle, row.organization, row.endorserType].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-1 text-xs text-zinc-400">For petition: {row.petition.title}</p>
          {row.statement && <p className="mt-2 text-sm text-zinc-700 dark:text-neutral-300">&ldquo;{row.statement}&rdquo;</p>}

          <textarea
            placeholder="Rejection notes (optional)"
            value={notes[row.id] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
            className="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            rows={2}
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => approve(row.id)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => reject(row.id)}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
