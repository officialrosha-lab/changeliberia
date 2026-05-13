'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

export function EmailLoginForm() {
  const setToken = useAuthStore((s) => s.setToken);
  const setAuthMethod = useAuthStore((s) => s.setAuthMethod);
  const setUserEmail = useAuthStore((s) => s.setUserEmail);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get('email'));
      const password = String(form.get('password'));

      const data = await apiPost<{ accessToken: string }>('/auth/login/email', {
        email,
        password,
      });

      setToken(data.accessToken);
      setAuthMethod('email');
      setUserEmail(email);
      const next = searchParams.get('next') || '/dashboard';
      setMessage('Signed in. Redirecting...');
      window.setTimeout(() => router.push(next), 400);
    } catch (error: unknown) {
      setIsError(true);
      let messageText = 'Invalid email or password. Please try again.';

      if (error instanceof Error) {
        const normalized = error.message || '';
        if (
          normalized === 'Request failed' ||
          normalized.includes('Failed to fetch') ||
          normalized.includes('NetworkError') ||
          normalized.includes('timeout')
        ) {
          messageText = 'Unable to reach the server. Please check your connection or try again later.';
        } else if (normalized.length > 0) {
          messageText = normalized;
        }
      }

      setMessage(messageText);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500';

  return (
    <form onSubmit={submit} className="space-y-4">
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

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
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
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
