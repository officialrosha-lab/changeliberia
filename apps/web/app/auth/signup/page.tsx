'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneSignupForm } from './phone-signup-form';
import { EmailSignupForm } from './email-signup-form';
import { GoogleAuthButton } from '../../../components/google-auth-button';
import { useAuthStore } from '../../../lib/store';

type SignupMethod = 'phone' | 'email';

export default function SignupPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [method, setMethod] = useState<SignupMethod>('phone');

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Create your account
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-neutral-50">
            Join verified civic action
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
            Create an account so you can launch petitions, build trust with verification, and keep supporters updated.
          </p>

          {/* Auth method tabs */}
          <div className="mt-6 flex gap-2 border-b border-zinc-200 dark:border-neutral-700">
            <button
              onClick={() => setMethod('phone')}
              className={`pb-3 text-sm font-semibold transition-colors ${
                method === 'phone'
                  ? 'border-b-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Phone + OTP
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`pb-3 text-sm font-semibold transition-colors ${
                method === 'email'
                  ? 'border-b-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Email + Password
            </button>
          </div>

          {/* Form content */}
          <div className="mt-6">
            {method === 'phone' && (
              <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
                <PhoneSignupForm />
              </Suspense>
            )}
            {method === 'email' && <EmailSignupForm />}
          </div>

          {/* Divider or Google OAuth */}
          <div className="mt-6">
            <GoogleAuthButton />
          </div>

          <p className="mt-6 text-sm text-zinc-500 dark:text-neutral-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Log in
            </Link>
          </p>
        </section>

        <aside className="relative overflow-hidden rounded-3xl bg-emerald-600 p-6 md:p-8">
          {/* Background illustration */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/hero-1.png"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
          />

          {/* Dark overlay behind text */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 z-10 bg-gradient-to-t from-emerald-900/90 via-emerald-900/60 to-transparent pointer-events-none" />

          {/* Content pushed down, on top of image */}
          <div className="relative z-20 mt-52 md:mt-64">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
              What you unlock
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-white">
              Your voice, verified
            </h2>
            <ul className="mt-5 space-y-4">
              {[
                {
                  icon: '📋',
                  title: 'Launch petitions',
                  desc: 'Start and manage campaigns from one dashboard.',
                },
                {
                  icon: '🛡️',
                  title: 'Build trust',
                  desc: 'Complete verification so your campaigns carry more credibility with decision-makers.',
                },
                {
                  icon: '📣',
                  title: 'Keep supporters informed',
                  desc: 'Post updates and respond to momentum as your campaign grows.',
                },
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur-sm">
                    {icon}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm text-emerald-100">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-black/20 p-4 text-sm leading-relaxed text-emerald-50 backdrop-blur-sm">
              Your details make campaigns on this platform more credible and easier for decision-makers to take
              seriously.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

