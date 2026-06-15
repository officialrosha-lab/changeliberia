'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailLoginForm } from './email-login-form';
import { GoogleAuthButton } from '../../../components/google-auth-button';
import { useAuthStore } from '../../../lib/store';

export default function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

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

function LoginPageClient() {
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('emailVerificationSent')) {
      setShowVerificationMessage(true);
      window.history.replaceState({}, '', '/auth/login');
    }
  }, []);

  return (
    <div>
      {showVerificationMessage && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/40 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Verification email sent!</span> Check your email for a verification link to confirm your account before logging in.
          </p>
        </div>
      )}

      <EmailLoginForm />

      <div className="mt-6">
        <GoogleAuthButton />
      </div>
    </div>
  );
}

