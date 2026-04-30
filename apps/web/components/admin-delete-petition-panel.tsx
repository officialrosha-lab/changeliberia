'use client';

import { useState } from 'react';
import { apiDelete } from '../lib/api';
import { useAuthStore } from '../lib/store';

export function AdminDeletePetitionPanel() {
  const token = useAuthStore((s) => s.token);
  const [petitionId, setPetitionId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const trimmedId = petitionId.trim();
    if (!token || !trimmedId) return;
    if (!window.confirm('Delete this petition from the platform? This action cannot be undone.')) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsDeleting(true);

    try {
      await apiDelete(`/admin/petitions/${trimmedId}`, token);
      setStatusMessage(`Petition ${trimmedId} was deleted successfully.`);
      setPetitionId('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete petition.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:border dark:border-neutral-800">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Delete petition</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">
        Remove any petition by its ID. This is useful for invalid, abusive, or broken petitions.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300" htmlFor="delete-petition-id">
          Petition ID
        </label>
        <input
          id="delete-petition-id"
          type="text"
          value={petitionId}
          onChange={(event) => setPetitionId(event.target.value)}
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          placeholder="cmolawy8h0003lpamh2dqpqnh"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={!token || !petitionId.trim() || isDeleting}
          className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete petition'}
        </button>
        {statusMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
    </section>
  );
}
