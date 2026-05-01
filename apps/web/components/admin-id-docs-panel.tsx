'use client';

import { useState } from 'react';
import { apiPatch, getApiBase } from '../lib/api';
import { useAuthStore } from '../lib/store';

type PendingDoc = {
  id: string;
  type: string;
  fileUrl: string;
  user: { fullName: string; phone: string };
};

export function AdminIdDocsPanel({ initialDocs }: { initialDocs: PendingDoc[] }) {
  const token = useAuthStore((s) => s.token);
  const [docs, setDocs] = useState(initialDocs);

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    await apiPatch(`/admin/id-documents/${id}`, { status }, token);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function isLocallyStoredUpload(url: string): boolean {
    return url.includes('/uploads/id-documents/');
  }

  async function openFile(d: PendingDoc) {
    if (!token) return;
    if (!isLocallyStoredUpload(d.fileUrl)) {
      window.open(d.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const base = getApiBase();
    const res = await fetch(`${base}/verification/id-documents/${d.id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('Location');
      if (loc) window.open(loc, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
  }

  if (docs.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">ID document reviews</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">No pending uploads.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">ID document reviews</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {docs.map((d) => (
          <li key={d.id} className="rounded-lg border border-zinc-200 p-3 dark:border-neutral-700">
            <p className="font-medium text-zinc-900 dark:text-neutral-50">
              {d.user.fullName} · {d.type}
            </p>
            <button
              type="button"
              onClick={() => void openFile(d)}
              className="text-emerald-600 underline dark:text-emerald-400"
            >
              View file
            </button>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => review(d.id, 'APPROVED')}
                disabled={!token}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => review(d.id, 'REJECTED')}
                disabled={!token}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
