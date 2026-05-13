'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

export function EmailSignupForm() {
  const setToken = useAuthStore((s) => s.setToken);
  const setAuthMethod = useAuthStore((s) => s.setAuthMethod);
  const setUserEmail = useAuthStore((s) => s.setUserEmail);
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string) => {
    const feedback: string[] = [];
    if (pwd.length < 8) feedback.push('At least 8 characters');
    if (!/[A-Z]/.test(pwd)) feedback.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) feedback.push('One lowercase letter');
    if (!/\d/.test(pwd)) feedback.push('One number');

    if (feedback.length > 0) {
      setPasswordFeedback(`Password needs: ${feedback.join(', ')}`);
    } else {
      setPasswordFeedback('Password looks good ✓');
    }
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);
    try {
      const form = new FormData(e.currentTarget);
      const pwd = String(form.get('password'));

      // Validate password strength
      const validation = validatePassword(pwd);
      if (passwordFeedback.includes('needs:')) {
        setIsError(true);
        setMessage('Password does not meet requirements');
        setSubmitting(false);
        return;
      }

      const data = await apiPost<{ accessToken: string }>('/auth/signup/email', {
        fullName: String(form.get('fullName')),
        phone: String(form.get('phone')),
        email: String(form.get('email')),
        password: pwd,
      });

      setToken(data.accessToken);
      setAuthMethod('email');
      setUserEmail(String(form.get('email')));
      setMessage('Account created. Redirecting to dashboard...');
      window.setTimeout(() => router.push('/dashboard'), 400);
    } catch (error: any) {
      setIsError(true);
      setMessage(
        error?.message || 'We could not create your account. Please try again.'
      );
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

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 dark:text-neutral-200">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
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
        {passwordFeedback && (
          <p
            className={`mt-2 text-xs font-medium ${
              passwordFeedback.includes('looks good')
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {passwordFeedback}
          </p>
        )}
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
