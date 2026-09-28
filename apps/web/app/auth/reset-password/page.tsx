'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { apiPost } from '../../../lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');

  const inputClass =
    'w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500';

  // Validate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 'weak';
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength === 2) return 'fair';
    if (strength === 3) return 'good';
    return 'strong';
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (!emailParam || !tokenParam) {
      setStatus('error');
      setMessage('Invalid reset link');
      setError('Missing email or token');
      setIsValidating(false);
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);

    // Validate token
    const validateToken = async () => {
      try {
        const response = await apiPost<{ valid: boolean }>('/auth/validate-reset-token', {
          email: emailParam,
          token: tokenParam,
        });
        if (!response.valid) {
          throw new Error('Invalid or expired reset link');
        }
        setIsTokenValid(true);
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setMessage('Invalid or expired reset link');
        setError(err instanceof Error ? err.message : 'Token validation failed');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setError(null);

    try {
      await apiPost('/auth/reset-password', {
        email,
        token,
        newPassword,
      });
      setStatus('success');
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-neutral-950">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-900/40 dark:border-t-emerald-500" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-neutral-400">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">Reset password</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-neutral-400">
              Create a new password for your account.
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
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
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
              <Link
                href="/auth/forgot-password"
                className="inline-block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Request new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Input */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
                  New password
                </label>
                <div className="relative mt-2">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Strength:</span>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength === 'weak'
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength === 'fair'
                            ? 'text-amber-600 dark:text-amber-400'
                            : passwordStrength === 'good'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-neutral-700">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength === 'weak'
                            ? 'w-1/4 bg-red-600'
                            : passwordStrength === 'fair'
                            ? 'w-1/2 bg-amber-600'
                            : passwordStrength === 'good'
                            ? 'w-3/4 bg-emerald-600'
                            : 'w-full bg-emerald-600'
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-neutral-400">
                      Use 8+ characters, mix uppercase, lowercase, numbers, and symbols
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className={`mt-2 ${inputClass}`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-900/40 dark:bg-red-950/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isTokenValid}
                className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Resetting…' : 'Reset password'}
              </button>

              {/* Back to Login */}
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
