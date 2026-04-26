'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
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

      {action && (
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
    </motion.div>
  );
}

export function EmptyStatePetitions() {
  return (
    <EmptyState
      icon="📝"
      title="No Petitions Found"
      description="Try adjusting your search filters or browse all petitions to find causes you care about."
      action={{
        label: 'Browse All Petitions',
        href: '/petitions',
      }}
    />
  );
}

export function EmptyStateUserPetitions() {
  return (
    <EmptyState
      icon="✍️"
      title="No Petitions Yet"
      description="You haven't created any petitions. Start your first petition to raise awareness about issues that matter to you."
      action={{
        label: 'Create Your First Petition',
        href: '/create',
      }}
    />
  );
}

export function EmptyStateSignatures() {
  return (
    <EmptyState
      icon="✓"
      title="No Signatures Yet"
      description="Be the first to sign! Help bring awareness to important causes in Liberia."
      action={{
        label: 'Browse Petitions',
        href: '/petitions',
      }}
    />
  );
}

export function EmptyStateDashboard() {
  return (
    <EmptyState
      icon="📊"
      title="Welcome to Your Dashboard"
      description="Create your first petition or sign petitions you care about to get started."
      action={{
        label: 'Create a Petition',
        href: '/create',
      }}
    />
  );
}

export function EmptyStateSearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No Results Found"
      description={`We couldn't find any petitions matching "${query}". Try different keywords or browse popular petitions.`}
      action={{
        label: 'Clear Search',
        href: '/petitions',
      }}
    />
  );
}
