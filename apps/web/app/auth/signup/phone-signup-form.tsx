'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

export function PhoneSignupForm() {
  const setToken = useAuthStore((s) => s.setToken);
  const setAuthMethod = useAuthStore((s) => s.setAuthMethod);
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      const form = new FormData(e.currentTarget);
      const data = await apiPost<{ accessToken: string }>('/auth/signup', {
        fullName: String(form.get('fullName')),
        phone: String(form.get('phone')),
        email: String(form.get('email')),
      });
      setToken(data.accessToken);
      setAuthMethod('phone');
      setMessage('Account created. Redirecting to your dashboard...');
      window.setTimeout(() => router.push('/dashboard'), 400);
    } catch (error: any) {
      setIsError(true);
      setMessage(error?.message || 'We could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          placeholder="e.g. James Weah"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="+231 77 000 0000"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputClass}
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
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
