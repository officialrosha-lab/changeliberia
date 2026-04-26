'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiPatch } from '../lib/api';
import { useAuthStore } from '../lib/store';

type Petition = {
  id: string;
  title: string;
  category?: string | null;
  summary: string;
};

const CATEGORIES = [
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'education', label: 'Education' },
  { id: 'health', label: 'Health' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'governance', label: 'Governance' },
  { id: 'youth', label: 'Youth & Jobs' },
  { id: 'environment', label: 'Environment' },
  { id: 'women', label: 'Women & Gender' },
  { id: 'human-rights', label: 'Human Rights' },
];

export function AdminPendingPetitionsPanel({ initial }: { initial: Petition[] }) {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string | null>>({});

  const handleCategoryChange = (id: string, category: string | null) => {
    setSelectedCategory((prev) => ({ ...prev, [id]: category }));
  };

  async function approve(id: string) {
    if (!token) return;
    const category = selectedCategory[id] ?? rows.find((p) => p.id === id)?.category ?? null;
    await apiPatch(`/petitions/${id}/approve`, { category: category || undefined }, token);
    setRows((r) => r.filter((p) => p.id !== id));
    setExpandedId(null);
  }

  async function rejectPetition(id: string) {
    if (!token) return;
    await apiPatch(`/petitions/${id}/reject`, {}, token);
    setRows((r) => r.filter((p) => p.id !== id));
    setExpandedId(null);
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:border dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Petition approvals</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">No pending petitions.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:border dark:border-neutral-800">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Petition approvals</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((p) => {
          const isExpanded = expandedId === p.id;
          const selectedCat = selectedCategory[p.id] ?? p.category ?? null;

          return (
            <li key={p.id} className="rounded-lg bg-zinc-50 dark:bg-neutral-800 p-4">
              <div className="flex flex-col gap-2">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/petitions/${p.id}`}
                      className="font-medium text-emerald-600 dark:text-emerald-400 underline decoration-emerald-300 dark:decoration-emerald-700 underline-offset-2 hover:decoration-emerald-600 dark:hover:decoration-emerald-500 break-words"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-500 line-clamp-2">
                      {p.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                  >
                    <svg className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>

                {/* Category badge */}
                {p.category && !isExpanded && (
                  <div className="text-xs">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                      {CATEGORIES.find((c) => c.id === p.category)?.label || p.category}
                    </span>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-zinc-200 dark:border-neutral-700 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
                        Assign Cause
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(p.id, cat.id === selectedCat ? null : cat.id)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                              selectedCat === cat.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      {selectedCat && (
                        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ {CATEGORIES.find((c) => c.id === selectedCat)?.label} selected
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-neutral-700 pt-3">
                      <button
                        type="button"
                        onClick={() => approve(p.id)}
                        disabled={!token}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectPetition(p.id)}
                        disabled={!token}
                        className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="ml-auto inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Compact action buttons when collapsed */}
                {!isExpanded && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => approve(p.id)}
                      disabled={!token}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectPetition(p.id)}
                      disabled={!token}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
