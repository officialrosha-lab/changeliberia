'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

export function LoginForm() {
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      const form = new FormData(e.currentTarget);
      const data = await apiPost<{ accessToken: string }>('/auth/login', {
        phone: String(form.get('phone')),
      });
      setToken(data.accessToken);
      const next = searchParams.get('next') || '/dashboard';
      setMessage('Signed in. Redirecting...');
      window.setTimeout(() => router.push(next), 400);
    } catch {
      setIsError(true);
      setMessage('We could not sign you in. Check your phone number and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Change Liberia" className="h-6 w-auto object-contain dark:hidden" />
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Change Liberia</span>
        </Link>
        <span className="text-zinc-300 dark:text-neutral-700">/</span>
        <span className="text-sm text-zinc-400 dark:text-neutral-500">Log in</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
        Welcome back
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
        Log in to your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
        Manage petitions, publish updates, and track your campaign progress.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-zinc-800 dark:text-neutral-200">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+231 770 000 000"
            className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500"
          />
        </div>

        {message && (
          <p
            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
              isError
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}
          >
            {message}
          </p>
        )}

        <button
          disabled={submitting}
          className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {submitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-500 dark:text-neutral-400">
        New here?{' '}
        <Link href="/auth/signup" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}

