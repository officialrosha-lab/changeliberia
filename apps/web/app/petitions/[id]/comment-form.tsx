'use client';

import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../../../lib/api';
import { useToast } from '../../../lib/toast-context';

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CommentForm({
  petitionId,
  initialComments,
}: {
  petitionId: string;
  initialComments: Comment[];
}) {
  const toast = useToast();
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await apiPost<Comment>(`/petitions/${petitionId}/comments`, {
        authorName: authorName.trim(),
        body: body.trim(),
      });
      setComments((prev) => [created, ...prev]);
      setBody('');
      toast.show('Posted. Thank you for adding your voice.', 'success');
    } catch {
      toast.show('Could not post. Try again in a moment.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-2.5 mb-1">
        <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-neutral-50">
          Supporter voices
        </h2>
        {comments.length > 0 && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {comments.length}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 dark:text-neutral-400">
        Supporters explain why this campaign matters to them.
      </p>

      <ul className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500">
                    {c.authorName.charAt(0).toUpperCase()}
                  </span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">{c.authorName}</p>
                </div>
                <p className="text-xs text-zinc-400 dark:text-neutral-500">{formatDate(c.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-neutral-300">{c.body}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {comments.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-zinc-500 dark:text-neutral-400">Be the first to share your voice.</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-3 border-t border-zinc-100 pt-5 dark:border-neutral-800">
        <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Add your voice</p>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name"
          disabled={submitting}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share why this campaign matters to you…"
          rows={3}
          disabled={submitting}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {submitting && (
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.22 4.22l2.83 2.83m4 0l2.83-2.83M4 12h4m12 0h4m-4.22 7.78l-2.83-2.83m-4 0l-2.83 2.83" />
            </motion.svg>
          )}
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </div>
  );
}
