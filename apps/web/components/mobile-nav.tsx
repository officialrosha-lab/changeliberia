'use client';

import { X, Menu } from 'lucide-react';
import { useMenuStore } from '../lib/store';

export function MobileNav() {
  const { isMenuOpen: isOpen, toggleMenu } = useMenuStore();

  return (
    <button
      onClick={toggleMenu}
      className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      {isOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
    </button>
  );
}
