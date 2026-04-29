'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';

export default function SessionsPage() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  function signOutEverywhere() {
    setToken(null);
    router.push('/');
  }

  const signedIn = !!token;

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white">
          ← Settings
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Active Sessions</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Devices and browsers currently signed in to your account.
        </p>

        <div className="mt-6 space-y-3">
          {signedIn ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">This device</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Current session · Active now</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                Active
              </span>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-neutral-400">No active sessions found.</p>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-neutral-700">
          <p className="text-sm text-zinc-600 dark:text-neutral-300">
            Sign out of all devices to secure your account if you think your account may be compromised.
          </p>
          <button
            onClick={signOutEverywhere}
            className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Sign out everywhere
          </button>
        </div>
      </div>
    </main>
  );
}
