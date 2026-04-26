'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

type Props = {
  children: React.ReactNode;
  /** Roles allowed to view this page. Defaults to ['ADMIN']. */
  roles?: string[];
};

export function AdminGuard({ children, roles = ['ADMIN'] }: Props) {
  const token = useAuthStore((s) => s.token);
  const [phase, setPhase] = useState<'loading' | 'denied' | 'ok'>('loading');

  useEffect(() => {
    if (!token) {
      setPhase('denied');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiGet<{ role: string }>('/users/me', token);
        if (cancelled) return;
        setPhase(roles.includes(me.role) ? 'ok' : 'denied');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [token, roles]);

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Checking access…
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
                with an admin account to view this page.
              </>
            ) : (
              'Your account does not have permission to view this page.'
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
