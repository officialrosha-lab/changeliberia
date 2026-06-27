'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMenuStore } from '../lib/store';
import { useTheme } from '../lib/theme-context';
import { apiGet } from '../lib/api';

const EXPLORE_ITEMS = [
  { href: '/petitions', icon: '🔍', label: 'Browse causes' },
  { href: '/#donate',       icon: '💛', label: 'Donate' },
  { href: '/#how-it-works', icon: '💡', label: 'How it works' },
];

export function MobileNav() {
  const { isMenuOpen: isOpen, closeMenu, toggleMenu } = useMenuStore();
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  useEffect(() => {
    async function loadDonationSettings() {
      try {
        const settings = await apiGet<{ donationsEnabled: boolean }>('/settings/system');
        setDonationsEnabled(settings.donationsEnabled);
      } catch {
        setDonationsEnabled(true);
      }
    }
    loadDonationSettings();
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
    <>
      {/* Hamburger — shown in top header on mobile */}
      <button
        onClick={toggleMenu}
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
          onClick={() => closeMenu()}
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-neutral-800">
          <img src="/logo.png" alt="Change Liberia" className="h-8 w-auto max-w-[150px] object-contain dark:hidden" />
          <span className="hidden dark:block text-base font-extrabold text-emerald-400">Change Liberia</span>
          <button
            onClick={() => closeMenu()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="Close menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">

          {/* Top-level pages — always visible at the top, no scrolling needed */}
          <Link
            href="/civic-pulse"
            onClick={() => closeMenu()}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
          >
            <span className="text-base">📊</span>
            Civic Pulse
          </Link>

          {token && (
            <>
              <Link
                href="/messages"
                onClick={() => closeMenu()}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <span className="text-base">✉️</span>
                Messages
              </Link>
              <Link
                href="/dashboard"
                onClick={() => closeMenu()}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <span className="text-base">📋</span>
                Dashboard
              </Link>
            </>
          )}

          {/* Explore section */}
          <p className="mt-3 px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
            Explore
          </p>
          {EXPLORE_ITEMS.map((item) => {
            if (item.href === '/#donate' && !donationsEnabled) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => closeMenu()}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* Auth actions */}
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-neutral-800">
            {token ? (
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                <span className="text-base">🚪</span>
                Log out
              </button>
            ) : (
              <div className="flex gap-2 px-1">
                <Link
                  href="/auth/signup"
                  onClick={() => closeMenu()}
                  className="flex-1 rounded-xl border border-emerald-400 px-3 py-2.5 text-center text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/30 focus:outline-none"
                >
                  Sign up
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => closeMenu()}
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Footer — theme toggle */}
        <div className="border-t border-zinc-100 px-5 py-4 dark:border-neutral-800">
          <button
            onClick={() => { toggleTheme(); closeMenu(); }}
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
