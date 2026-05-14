'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { apiGet } from '../lib/api';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { NotificationDropdown } from './notification-dropdown';
import { JoinMovementButton } from './join-movement-button';

export function Header() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const [donationsEnabled, setDonationsEnabled] = useState(true);

  useEffect(() => {
    async function loadDonationSettings() {
      try {
        const settings = await apiGet<{
          donationsEnabled: boolean;
        }>('/admin/settings/system', token || undefined);
        setDonationsEnabled(settings.donationsEnabled);
      } catch (err) {
        // If error, default to enabled
        setDonationsEnabled(true);
      }
    }
    loadDonationSettings();
  }, [token]);

  function signOut() {
    setToken(null);
    router.push('/');
  }

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:gap-4 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6 lg:gap-10">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Change Liberia"
              className="h-7 w-auto max-w-[120px] sm:h-8 sm:max-w-[140px] md:h-9 md:max-w-[160px] object-contain dark:hidden"
            />
            <img
              src="/logo-icon.png"
              alt=""
              aria-hidden
              className="hidden dark:block h-7 sm:h-8 md:h-9 w-auto object-contain"
            />
            <span className="hidden dark:block text-sm font-bold tracking-tight text-emerald-400 sm:text-base md:text-lg">
              Change Liberia
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-600 dark:text-neutral-300 md:flex">
            {token && (
              <Link href="/dashboard" className="font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded px-2 py-1">
                My petitions
              </Link>
            )}
            <Link href="/petitions" className="inline-flex items-center gap-1 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded px-2 py-1">
              <span aria-hidden>🔍</span>
              <span className="hidden lg:inline">Search</span>
            </Link>
            {donationsEnabled && (
              <Link href="/#donate" className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 rounded px-2 py-1">
                Donate
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          <Link
            href="/create"
            className="hidden md:inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300 dark:focus:ring-emerald-600"
          >
            Start a petition
          </Link>
          
          <JoinMovementButton />

          <ThemeToggle />

          {token && <NotificationDropdown />}
          
          <div className="hidden items-center gap-2 sm:flex md:gap-3">
            {token ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-emerald-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-emerald-400 sm:px-4 md:px-4 md:py-2 md:text-sm min-h-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  title="Settings"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-emerald-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
                <button
                  onClick={signOut}
                  className="text-xs font-medium text-zinc-700 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 transition-colors md:text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 rounded px-2 py-1"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400 md:text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300 dark:focus:ring-emerald-600"
                >
                  Sign up
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400 md:text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300 dark:focus:ring-emerald-600"
                >
                  Log in
                </Link>
              </>
            )}
          </div>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
