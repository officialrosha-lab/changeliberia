'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
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
        const response = await apiPost('/auth/verify-email', {
          email,
          token,
        });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Verify Email</h1>
            <p className="text-gray-600 mt-2">Change Liberia</p>
          </div>

          {/* Status Content */}
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="mb-4">
                  <div className="inline-block">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
                  </div>
                </div>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mb-4">
                  <div className="inline-block">
                    <svg
                      className="w-12 h-12 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-green-600 font-medium">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mb-4">
                  <div className="inline-block">
                    <svg
                      className="w-12 h-12 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-red-600 font-medium mb-2">{message}</p>
                <p className="text-gray-600 text-sm mb-6">{error}</p>

                <div className="space-y-3">
                  {email && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(email);
                        alert('Email copied to clipboard');
                      }}
                      className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                    >
                      Copy Email Address
                    </button>
                  )}
                  <Link
                    href="/auth/signup"
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Back to Signup
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Need help? Contact{' '}
              <a href="mailto:support@changelib.org" className="text-blue-600 hover:underline">
                support@changelib.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
