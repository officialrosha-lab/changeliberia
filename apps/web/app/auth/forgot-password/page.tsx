'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setError(null);

    try {
      await apiPost('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(`Password reset link sent to ${email}`);
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">Forgot password?</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">
              Enter your email to reset your password.
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
              <p className="mb-4 font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
              <p className="mb-6 text-sm text-zinc-500 dark:text-neutral-400">
                Check your email for instructions to reset your password. The link will expire in 1 hour.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/40 dark:bg-red-950/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-zinc-500 dark:text-neutral-400">
                  Remember your password?{' '}
                  <Link href="/auth/login" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-zinc-200 pt-6 text-center dark:border-neutral-700">
            <p className="text-sm text-zinc-500 dark:text-neutral-400">
              Need help? Contact{' '}
              <a href="mailto:support@changeliberia.org" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                support@changeliberia.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
