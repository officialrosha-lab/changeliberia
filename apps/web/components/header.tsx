'use client';

import Link from 'next/link';
import { useAuthStore } from '../lib/store';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { NotificationDropdown } from './notification-dropdown';

export function Header() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
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
            <Link href="/#donate" className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 rounded px-2 py-1">
              Donate
            </Link>
          </nav>
        </div>
        
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          <Link
            href="/create"
            className="hidden md:inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300 dark:focus:ring-emerald-600"
          >
            Start a petition
          </Link>
          
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
                <button
                  onClick={() => setToken(null)}
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
