'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';
import { useAuthStore, type AuthUser } from '../../../lib/store';

export default function VerifyEmailPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputClass =
    'mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    setStatus('verifying');

    try {
      const data = await apiPost<{ user: AuthUser }>('/auth/verify-email', {
        email,
        code,
      });
      setSession(data.user);
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    }
  }

  async function resendCode() {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setResending(true);
    setResendMessage(null);
    setError(null);
    try {
      await apiPost('/auth/resend-verification-email', { email });
      setResendMessage('A new code is on its way. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">Verify your email</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">
              Enter the 6-digit code we sent to your inbox.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                Email verified successfully! Taking you to your dashboard...
              </p>
            </div>
          ) : (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
                  Verification code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className={`${inputClass} text-center text-2xl font-bold tracking-[0.4em]`}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </p>
              )}

              {resendMessage && (
                <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {resendMessage}
                </p>
              )}

              <button
                disabled={status === 'verifying' || code.length !== 6}
                className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {status === 'verifying' ? 'Verifying…' : 'Verify email'}
              </button>

              <button
                type="button"
                onClick={resendCode}
                disabled={resending}
                className="w-full text-center text-xs font-semibold text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400"
              >
                {resending ? 'Sending…' : "Didn't get a code? Resend it"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-zinc-200 pt-6 text-center dark:border-neutral-700">
            <p className="text-sm text-zinc-500 dark:text-neutral-400">
              Need help? Contact{' '}
              <a href="mailto:support@changeliberia.org" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                support@changeliberia.org
              </a>
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">
              <Link href="/auth/signup" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                Back to signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
