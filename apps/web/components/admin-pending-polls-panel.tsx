'use client';

import { useState } from 'react';
import { apiPost, apiDelete } from '../lib/api';
import { useAuthStore } from '../lib/store';

type PollSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  county?: string | null;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
};

export function AdminPendingPollsPanel({ initial }: { initial: PollSummary[] }) {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function approvePoll(id: string) {
    if (!token) return;
    setApprovingId(id);
    try {
      await apiPost(`/polls/${id}/approve`, {}, token);
      setRows((r) => r.filter((p) => p.id !== id));
      setExpandedId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to approve poll');
    } finally {
      setApprovingId(null);
    }
  }

  async function rejectPoll(id: string) {
    if (!token) return;
    setRejectingId(id);
    try {
      await apiPost(`/polls/${id}/reject`, {}, token);
      setRows((r) => r.filter((p) => p.id !== id));
      setExpandedId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to reject poll');
    } finally {
      setRejectingId(null);
    }
  }

  async function deletePoll(id: string) {
    if (!token) return;
    if (!window.confirm('Delete this poll submission? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      await apiDelete(`/admin/polls/${id}`, token);
      setRows((r) => r.filter((p) => p.id !== id));
      setExpandedId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete poll');
    } finally {
      setDeletingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:border dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Poll submissions</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">No pending poll submissions.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:border dark:border-neutral-800">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-neutral-50">Poll submissions</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
        {rows.length} {rows.length === 1 ? 'submission' : 'submissions'} awaiting approval
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {rows.map((poll) => {
          const isExpanded = expandedId === poll.id;
          const createdDate = new Date(poll.createdAt);
          const formattedDate = createdDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li key={poll.id} className="rounded-lg bg-zinc-50 dark:bg-neutral-800 p-4">
              <div className="flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-neutral-50 break-words">
                      {poll.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 dark:text-neutral-400">
                      <span>By {poll.creatorName}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                    {poll.description && (
                      <p className="mt-2 text-xs text-zinc-700 dark:text-neutral-300 line-clamp-2">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : poll.id)}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>

                {/* Category/County badges */}
                {!isExpanded && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
                      {poll.category}
                    </span>
                    {poll.county && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium">
                        {poll.county}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-zinc-200 dark:border-neutral-700 pt-3">
                    {/* Full description */}
                    {poll.description && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
                          Description
                        </label>
                        <p className="text-sm text-zinc-700 dark:text-neutral-300 whitespace-pre-wrap">
                          {poll.description}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-zinc-600 dark:text-neutral-400">Category</span>
                        <p className="mt-1 text-zinc-700 dark:text-neutral-300">{poll.category}</p>
                      </div>
                      {poll.county && (
                        <div>
                          <span className="font-semibold text-zinc-600 dark:text-neutral-400">County</span>
                          <p className="mt-1 text-zinc-700 dark:text-neutral-300">{poll.county}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-zinc-600 dark:text-neutral-400">Submitted by</span>
                        <p className="mt-1 text-zinc-700 dark:text-neutral-300">{poll.creatorName}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-600 dark:text-neutral-400">Email</span>
                        <p className="mt-1 text-zinc-700 dark:text-neutral-300 break-all">{poll.creatorEmail}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-neutral-700 pt-3">
                      <button
                        type="button"
                        onClick={() => approvePoll(poll.id)}
                        disabled={!token || approvingId === poll.id}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      >
                        {approvingId === poll.id ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectPoll(poll.id)}
                        disabled={!token || rejectingId === poll.id}
                        className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        {rejectingId === poll.id ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePoll(poll.id)}
                        disabled={!token || deletingId === poll.id}
                        className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                      >
                        {deletingId === poll.id ? 'Deleting…' : 'Delete'}
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
                      onClick={() => approvePoll(poll.id)}
                      disabled={!token || approvingId === poll.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                      {approvingId === poll.id ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectPoll(poll.id)}
                      disabled={!token || rejectingId === poll.id}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {rejectingId === poll.id ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePoll(poll.id)}
                      disabled={!token || deletingId === poll.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === poll.id ? 'Deleting…' : 'Delete'}
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
