'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

type Props = { children: React.ReactNode };

/**
 * Gates official-only pages. Unlike admin-guard.tsx (which just checks
 * User.role), this checks whether the current user holds a VERIFIED
 * Institution via GET /officials/me.
 */
export function OfficialGuard({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [phase, setPhase] = useState<'loading' | 'denied' | 'pending' | 'ok'>('loading');

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setPhase('denied');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<{ officialStatus: string }>('/officials/me', token);
        if (cancelled) return;
        if (me.officialStatus === 'VERIFIED') setPhase('ok');
        else setPhase('pending');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, hydrated]);

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Checking access…
      </main>
    );
  }

  if (phase === 'pending') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8">
          <h1 className="text-2xl font-bold text-yellow-800">Application under review</h1>
          <p className="mt-3 text-yellow-700">
            Your official account application has not yet been verified by an administrator.
            You&apos;ll be notified by email once it&apos;s reviewed.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-700">Access denied</h1>
          <p className="mt-3 text-red-600">
            {!token ? (
              <>
                You must{' '}
                <Link href="/auth/login" className="font-semibold underline">
                  sign in
                </Link>{' '}
                with an official account to view this page.
              </>
            ) : (
              <>
                No official account was found for this user. Apply for one{' '}
                <Link href="/official/apply" className="font-semibold underline">
                  here
                </Link>
                .
              </>
            )}
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
