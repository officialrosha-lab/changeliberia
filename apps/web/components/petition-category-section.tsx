'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PetitionGridCard } from './petition-grid-card';
import { PetitionListItem } from './petition-list-item';

type Petition = {
  id: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string | null;
  signaturesCount: number;
  todaySignatures: number;
  goal: number;
  category?: string | null;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
};

interface PetitionCategorySectionProps {
  category: string;
  petitions: Petition[];
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: 'grid' | 'list';
}

export function PetitionCategorySection({
  category,
  petitions,
  isExpanded,
  onToggle,
  viewMode,
}: PetitionCategorySectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-neutral-800 transition text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
            {category}
          </h2>
          <span className="text-sm text-zinc-500 dark:text-neutral-400 bg-zinc-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
            {petitions.length}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-zinc-500 dark:text-neutral-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-200 dark:border-neutral-800 px-6 py-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {petitions.map((petition) => (
                    <motion.div
                      key={petition.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PetitionGridCard petition={petition} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {petitions.map((petition) => (
                    <motion.div
                      key={petition.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PetitionListItem petition={petition} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
