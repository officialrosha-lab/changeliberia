'use client';

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'petition-card' | 'list-item' | 'form-field' | 'text-block' | 'avatar';
  count?: number;
  className?: string;
}

const skeletonVariants = {
  'petition-card': (
    <div className="space-y-4">
      <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
      </div>
    </div>
  ),
  'list-item': (
    <div className="flex items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
      </div>
      <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded flex-shrink-0" />
    </div>
  ),
  'form-field': (
    <div className="space-y-2">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
      <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
    </div>
  ),
  'text-block': (
    <div className="space-y-3">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
    </div>
  ),
  'avatar': (
    <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
  ),
};

export function SkeletonLoader({
  variant = 'list-item',
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const pulseAnimation = {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  };

  const skeleton = skeletonVariants[variant];

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={pulseAnimation}
          className={variant === 'petition-card' ? (i > 0 ? 'mt-6' : '') : i > 0 ? 'mt-4' : ''}
        >
          {skeleton}
        </motion.div>
      ))}
    </div>
  );
}

// Grid variant for multiple cards
export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colsClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader key={i} variant="petition-card" />
      ))}
    </div>
  );
}
