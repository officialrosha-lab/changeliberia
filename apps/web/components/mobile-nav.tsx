'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store';
import { useTheme } from '../lib/theme-context';

const PUBLIC_NAV_ITEMS = [
  { href: '/petitions', icon: '🔍', label: 'Browse causes' },
  { href: '/#donate',              icon: '💛', label: 'Donate' },
  { href: '/#how-it-works',        icon: '💡', label: 'How it works' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  function signOut() {
    setToken(null);
    setIsOpen(false);
    router.push('/');
  }
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 top-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-neutral-900 md:hidden safe-top ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-neutral-800">
          <img src="/logo.png" alt="Change Liberia" className="h-8 w-auto max-w-[150px] object-contain dark:hidden" />
          <span className="hidden dark:block text-base font-extrabold text-emerald-400">Change Liberia</span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="Close menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {token && (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="text-base">📋</span>
              My petitions
            </Link>
          )}
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-neutral-800">
            {token ? (
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                <span className="text-base">🚪</span>
                Log out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                >
                  <span className="text-base">👤</span>
                  Sign up
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                >
                  <span className="text-base">🔑</span>
                  Log in
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Footer — theme toggle */}
        <div className="border-t border-zinc-100 px-5 py-4 dark:border-neutral-800">
          <button
            onClick={() => { toggleTheme(); setIsOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-neutral-400 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
          >
            <span className="text-base">{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
        </div>
      </div>
    </>
  );
}
