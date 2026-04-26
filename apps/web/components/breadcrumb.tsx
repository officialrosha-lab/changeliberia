'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const pathSegmentMap: Record<string, string> = {
  dashboard: 'Dashboard',
  petitions: 'Petitions',
  create: 'Create Petition',
  admin: 'Admin',
  settings: 'Settings',
  profile: 'Profile',
  auth: 'Authentication',
};

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate items from pathname if not provided
  let breadcrumbs: BreadcrumbItem[] = items || [];

  if (!items) {
    breadcrumbs = [{ label: 'Home', href: '/' }];

    const segments = pathname
      .split('/')
      .filter((s) => s && s !== 'auth')
      .slice(0, 3); // Limit to 3 levels deep

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const href = '/' + segments.slice(0, i + 1).join('/');
      const label = pathSegmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const current = i === segments.length - 1;

      if (current) {
        breadcrumbs.push({ label, current: true });
      } else {
        breadcrumbs.push({ label, href });
      }
    }
  }

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb for home page
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg
              className="h-4 w-4 text-zinc-400 dark:text-zinc-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {item.current ? (
            <span className="text-zinc-900 dark:text-zinc-50 font-medium">{item.label}</span>
          ) : item.href ? (
            <Link
              href={item.href}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
          )}
        </div>
      ))}
    </motion.nav>
  );
}
