'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiPatch } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

const inputClass =
  'mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500';

export default function ChangePasswordPage() {
  const token = useAuthStore((s) => s.token);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setIsError(true);
      setMessage('New passwords do not match.');
      return;
    }
    if (!token) return;
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      await apiPatch('/users/me/password', { currentPassword: current, newPassword: next }, token);
      setMessage('Password changed successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: unknown) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Could not change password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white">
          ← Settings
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Change Password</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Choose a strong password with at least 8 characters, one uppercase letter, and one number.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">Current password</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">New password</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="••••••••" className={inputClass} />
          </div>

          {message && (
            <p className={`rounded-xl px-4 py-2.5 text-sm font-medium ${isError ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {submitting ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
