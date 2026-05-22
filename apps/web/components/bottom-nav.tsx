'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    ),
  },
  {
    href: '/petitions',
    label: 'Browse',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/create',
    label: 'Create',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const AUTH_ITEMS = [
  {
    href: '/auth/signup',
    label: 'Sign Up',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M5.25 6.375a6.375 6.375 0 1 1 12.75 0A6.375 6.375 0 0 1 5.25 6.375ZM15.75 12.75a4.875 4.875 0 1 1-9.75 0 4.875 4.875 0 0 1 9.75 0Z" />
      </svg>
    ),
  },
  {
    href: '/auth/login',
    label: 'Sign In',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5h6Zm-12 6a.75.75 0 0 0 0 1.5h14.25a.75.75 0 0 0 0-1.5H4.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  if (pathname?.includes('/admin') || pathname?.includes('/auth')) {
    return null;
  }

  function handleLogout() {
    setToken(null);
    router.push('/');
  }

  // Build navigation items based on auth status
  const displayItems = token ? NAV_ITEMS : [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2]];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 safe-bottom">
      <div className="flex items-stretch justify-around">
        {/* Main navigation items */}
        {displayItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href.split('#')[0]) && item.href.split('#')[0] !== '/';

          const isCreate = item.href === '/create';

          if (isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center py-1.5 px-2 min-h-12 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded transition-all"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-all active:scale-90 dark:bg-emerald-500">
                  {item.icon}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-1.5 px-2 min-h-12 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-700 dark:text-neutral-500 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-500" />
              )}
              {item.icon}
              <span className={`mt-1 text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Auth buttons when not logged in */}
        {!token && (
          <>
            {AUTH_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-1 flex-col items-center justify-center py-1.5 px-2 min-h-12 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-700 dark:text-neutral-500 dark:hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-500" />
                  )}
                  {item.icon}
                  <span className={`mt-1 text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </>
        )}

        {/* Logout button when logged in */}
        {token && (
          <button
            onClick={handleLogout}
            className="relative flex flex-1 flex-col items-center justify-center py-1.5 px-2 min-h-12 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 rounded text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 1 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9a.75.75 0 1 1-1.5 0V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm5.03 4.72a.75.75 0 0 0 0 1.06l1.72 1.72H10.5a.75.75 0 0 0 0 1.5h3.75l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 0 0-1.06 0Z" clipRule="evenodd" />
            </svg>
            <span className="mt-1 text-[10px] font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
