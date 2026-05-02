import Link from 'next/link';
import { FadeInOnScroll } from './scroll-animations';

const COLS = [
  {
    title: 'Get involved',
    links: [
      { href: '/create', label: 'Start a petition' },
      { href: '/petitions', label: 'Browse by topic' },
      { href: '/petitions', label: 'Search petitions' },
      { href: '/leaders', label: 'Become a Change Leader 🇱🇷' },
      { href: '/leaders', label: 'Join the Movement' },
      { href: '/leaders', label: 'How It Works' },
      { href: '/apply', label: 'Become a Voice for Change' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/create', label: 'Create your petition' },
      { href: '/collect-signatures', label: 'Collect signatures' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About us' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Help & legal',
    links: [
      { href: '/help-center', label: 'Help center' },
      { href: '/community-guidelines', label: 'Community guidelines' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export function SiteFooter() {
  return (
    <FadeInOnScroll>
      <footer className="border-t border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 md:py-16">

          {/* Top row: brand + columns */}
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[220px_1fr_1fr_1fr_1fr] md:gap-10">

            {/* Brand column */}
            <div className="flex flex-col gap-3">
              <Link href="/" className="block">
                <img src="/logo.png" alt="Change Liberia" className="h-10 w-auto max-w-[180px] object-contain dark:hidden" />
                <span className="hidden dark:block text-lg font-extrabold text-emerald-400 tracking-tight">Change Liberia</span>
              </Link>
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-neutral-400 max-w-xs break-words">
                Empowering every Liberian to raise issues, gather trusted support, and drive real civic change — from Monrovia to the countryside.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3 mt-1">
                <Link
                  href="#"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  aria-label="X (Twitter)"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Link columns */}
            {COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-neutral-50">
                  {col.title}
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-zinc-500 dark:text-neutral-400 sm:text-sm">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col gap-2 border-t border-zinc-100 pt-6 text-xs text-zinc-400 dark:border-neutral-800 dark:text-neutral-600 sm:mt-12 sm:pt-8 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()}{' '}
              <span className="font-semibold text-zinc-500 dark:text-neutral-500">Change Liberia</span>
              . Built for the people of Liberia.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-neutral-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-neutral-400 transition-colors">
                Terms
              </Link>
              <span>English (Liberia)</span>
            </div>
          </div>
        </div>
      </footer>
    </FadeInOnScroll>
  );
}
