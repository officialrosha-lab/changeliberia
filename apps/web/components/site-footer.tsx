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
