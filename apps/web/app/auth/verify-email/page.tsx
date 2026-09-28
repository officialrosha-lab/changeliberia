'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';
import { useToast } from '../../../lib/toast-context';

export default function VerifyEmailPage() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid verification link');
      setError('Missing email or token');
      return;
    }

    const verifyEmail = async () => {
      try {
        await apiPost('/auth/verify-email', { email, token });

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage('Email verification failed');
        setError(err.message || 'An error occurred during verification');
      }
    };

    verifyEmail();
  }, [email, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">Verify email</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">Change Liberia</p>
          </div>

          {/* Status Content */}
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="mb-4">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-900/40 dark:border-t-emerald-500" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-neutral-400">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="mb-2 font-medium text-red-600 dark:text-red-400">{message}</p>
                <p className="mb-6 text-sm text-zinc-500 dark:text-neutral-400">{error}</p>

                <div className="space-y-3">
                  {email && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(email);
                        toast.show('Email copied to clipboard', 'success');
                      }}
                      className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      Copy email address
                    </button>
                  )}
                  <Link
                    href="/auth/signup"
                    className="block w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Back to signup
                  </Link>
                </div>
              </>
            )}
          </div>

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
