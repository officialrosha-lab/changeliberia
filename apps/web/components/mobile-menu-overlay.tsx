'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMenuStore } from '../lib/store';
import { useTheme } from '../lib/theme-context';
import { apiGet } from '../lib/api';

const EXPLORE_ITEMS = [
  { href: '/petitions',     icon: '🔍', label: 'Browse causes' },
  { href: '/#donate',       icon: '💛', label: 'Donate' },
  { href: '/#how-it-works', icon: '💡', label: 'How it works' },
];

export function MobileMenuOverlay() {
  const { isMenuOpen: isOpen, closeMenu } = useMenuStore();
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  useEffect(() => {
    apiGet<{ donationsEnabled: boolean }>('/settings/system')
      .then((s) => setDonationsEnabled(s.donationsEnabled))
      .catch(() => setDonationsEnabled(true));
  }, [token]);

  function signOut() {
    setToken(null);
    closeMenu();
    router.push('/');
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    // z-[60] ensures this is above the sticky header (z-50) and bottom nav (z-40).
    // Mounted outside the sticky/stacking-context wrapper so it is never clipped
    // by overflow-x:hidden or will-change:transform on parent elements.
    <div
      className={`fixed inset-0 z-[60] flex flex-col bg-white dark:bg-neutral-900 transition-transform duration-300 ease-out md:hidden ${
        isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      aria-hidden={!isOpen}
      aria-label="Mobile navigation menu"
    >
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-neutral-800">
        <img
          src="/logo.png"
          alt="Change Liberia"
          className="h-8 w-auto max-w-[150px] object-contain dark:hidden"
        />
        <span className="hidden dark:block text-base font-extrabold text-emerald-400">
          Change Liberia
        </span>
        <button
          onClick={closeMenu}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav links — scrollable if content overflows */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">

        {/* Top-level pages — always first, always visible */}
        <Link
          href="/civic-pulse"
          onClick={closeMenu}
          className="flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-semibold text-zinc-800 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-100 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
        >
          <span className="text-xl">📊</span>
          Civic Pulse
        </Link>

        {token && (
          <>
            <Link
              href="/messages"
              onClick={closeMenu}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-semibold text-zinc-800 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-100 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="text-xl">✉️</span>
              Messages
            </Link>
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="text-xl">📋</span>
              Dashboard
            </Link>
          </>
        )}

        {/* Explore section */}
        <p className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
          Explore
        </p>
        {EXPLORE_ITEMS.map((item) => {
          if (item.href === '/#donate' && !donationsEnabled) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — auth actions + theme toggle */}
      <div className="border-t border-zinc-100 px-4 py-4 space-y-2 dark:border-neutral-800 safe-bottom">
        {token ? (
          <button
            onClick={signOut}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
          >
            <span className="text-xl">🚪</span>
            Log out
          </button>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/auth/signup"
              onClick={closeMenu}
              className="flex-1 rounded-full border border-emerald-400 py-3 text-center text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/30 focus:outline-none"
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              onClick={closeMenu}
              className="flex-1 rounded-full border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none"
            >
              Log in
            </Link>
          </div>
        )}

        <button
          onClick={() => { toggleTheme(); closeMenu(); }}
          className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:text-neutral-400 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
        >
          <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
          {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        </button>
      </div>
    </div>
  );
}
