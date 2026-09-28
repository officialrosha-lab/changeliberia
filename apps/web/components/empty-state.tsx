'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  illustration?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {illustration ? (
        <div className="mb-6 opacity-80">{illustration}</div>
      ) : (
        <div className="mb-6 text-4xl md:text-5xl opacity-50">{icon}</div>
      )}

      <h3 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
        {title}
      </h3>

      <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-sm mb-6">
        {description}
      </p>

      {action && action.href && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition active:scale-95 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 outline-none"
        >
          {action.label}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
      {action && !action.href && action.onClick && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition active:scale-95 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 outline-none"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

export function EmptyStatePetitions() {
  return (
    <EmptyState
      icon="📝"
      title="Nothing here yet"
      description="No petitions match right now. Try a different filter, or see everything that's currently active."
      action={{
        label: 'Browse all petitions',
        href: '/petitions',
      }}
    />
  );
}

export function EmptyStateUserPetitions() {
  return (
    <EmptyState
      icon="✍️"
      title="You haven't started one yet"
      description="Got something that needs fixing in your community? Put it into words — it takes about three minutes."
      action={{
        label: 'Start your first petition',
        href: '/create',
      }}
    />
  );
}

export function EmptyStateSignatures() {
  return (
    <EmptyState
      icon="✓"
      title="No one's signed yet"
      description="Be the first — your signature is what gets this one moving."
      action={{
        label: 'Browse petitions',
        href: '/petitions',
      }}
    />
  );
}

export function EmptyStateDashboard() {
  return (
    <EmptyState
      icon="📊"
      title="Your dashboard is empty for now"
      description="Start a petition on something you care about, or sign one that's already gathering support."
      action={{
        label: 'Start a petition',
        href: '/create',
      }}
    />
  );
}

export function EmptyStateSearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="Nothing matched that search"
      description={`We couldn't find any petitions matching "${query}". Try different words, or browse what's popular right now.`}
      action={{
        label: 'Clear search',
        href: '/petitions',
      }}
    />
  );
}
