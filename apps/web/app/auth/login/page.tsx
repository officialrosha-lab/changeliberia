'use client';

import { Suspense, useState } from 'react';
import { LoginForm } from './login-form';
import { EmailLoginForm } from './email-login-form';
import { GoogleAuthButton } from '../../../components/google-auth-button';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950 px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)]">
          {/* Form card */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-10">
            <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10 text-zinc-500">Loading…</main>}>
              <LoginPageClient />
            </Suspense>
          </section>

          {/* Right panel — why sign in */}
          <aside className="relative overflow-hidden rounded-3xl bg-emerald-600 md:p-10 p-8">
            {/* Background illustration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/hero-4.png"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover object-top pointer-events-none select-none"
            />

            {/* Gradient overlay behind text */}
            <div className="absolute inset-x-0 bottom-0 h-3/4 z-10 bg-gradient-to-t from-emerald-900/90 via-emerald-900/60 to-transparent pointer-events-none" />

            {/* Content pushed down */}
            <div className="relative z-20 mt-52 md:mt-64 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                  Your account
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Why sign in?
                </h2>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: '📋', text: 'Manage your petitions and track which ones are pending review.' },
                  { icon: '📢', text: 'Publish updates to supporters as your campaign grows.' },
                  { icon: '✅', text: 'Build trust with phone, location, and ID verification.' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-base backdrop-blur-sm">
                      {item.icon}
                    </span>
                    <p className="text-sm leading-relaxed text-emerald-100 pt-1.5">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-200/80 border-t border-white/20 pt-4">
                Your account helps make petitions on this platform more credible and more useful to the people asked to respond.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

type LoginMethod = 'phone' | 'email';

function LoginPageClient() {
  const [method, setMethod] = useState<LoginMethod>('phone');

  return (
    <div>
      {/* Auth method tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-neutral-700 mb-6">
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
      <div>
        {method === 'phone' && (
          <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
            <LoginForm />
          </Suspense>
        )}
        {method === 'email' && <EmailLoginForm />}
      </div>

      {/* Divider or Google OAuth */}
      <div className="mt-6">
        <GoogleAuthButton />
      </div>
    </div>
  );
}

