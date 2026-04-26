'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, List, ChevronDown } from 'lucide-react';
import { SearchBar, type SearchFilters } from './search-bar';
import { PetitionGridCard } from './petition-grid-card';
import { PetitionListItem } from './petition-list-item';
import { PetitionCategorySection } from './petition-category-section';

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

interface PetitionDiscoveryClientProps {
  data: {
    categories: Record<string, Petition[]>;
    trending: Petition[];
    total: number;
  };
}

export function PetitionDiscoveryClient({ data }: PetitionDiscoveryClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'trending',
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(data.categories).slice(0, 3)), // Expand first 3 categories by default
  );

  // Flatten all petitions for searching
  const allPetitions = useMemo(() => {
    const flat: Petition[] = [];
    for (const petitions of Object.values(data.categories)) {
      flat.push(...petitions);
    }
    return flat;
  }, [data.categories]);

  // Filter and sort petitions
  const filteredPetitions = useMemo(() => {
    let results = allPetitions;

    // Filter by search query
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.summary.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }

    // Filter by category if specified
    if (searchFilters.category && searchFilters.category !== 'all') {
      results = results.filter((p) => (p.category || 'Uncategorized') === searchFilters.category);
    }

    // Sort results
    const sorted = [...results];
    switch (searchFilters.sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'most-signed':
        sorted.sort((a, b) => b.signaturesCount - a.signaturesCount);
        break;
      case 'trending':
      default:
        sorted.sort((a, b) => b.todaySignatures - a.todaySignatures);
        break;
    }

    return sorted;
  }, [allPetitions, searchFilters]);

  // Build filtered categories based on search results
  const filteredCategories = useMemo(() => {
    if (!searchFilters.query && !searchFilters.category) {
      return data.categories;
    }

    const filtered: Record<string, Petition[]> = {};
    for (const category in data.categories) {
      const petitions = data.categories[category].filter((p) =>
        filteredPetitions.some((fp) => fp.id === p.id),
      );
      if (petitions.length > 0) {
        filtered[category] = petitions;
      }
    }
    return filtered;
  }, [data.categories, filteredPetitions, searchFilters.query, searchFilters.category]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    // Auto-expand first category when searching
    if (filters.query || filters.category !== 'all') {
      const firstCategory = Object.keys(filteredCategories)[0];
      if (firstCategory) {
        setExpandedCategories(new Set([firstCategory]));
      }
    }
  };

  const handleClear = () => {
    setSearchFilters({
      query: '',
      sortBy: 'trending',
    });
    setExpandedCategories(new Set(Object.keys(data.categories).slice(0, 3)));
  };

  // Get unique categories for filter dropdown
  const uniqueCategories = Object.keys(data.categories).map((cat) => ({
    value: cat,
    label: cat,
  }));

  const totalResults = filteredPetitions.length;

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-zinc-200 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-neutral-400 mb-4">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-neutral-200 transition">
              Home
            </Link>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span>Petitions</span>
          </div>

          {/* Title and controls */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                Discover causes
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
                Browse Petitions
              </h1>
              <p className="text-sm text-zinc-500 dark:text-neutral-400 mt-2">
                {totalResults > 0 ? (
                  <>
                    Showing <span className="font-semibold text-zinc-700 dark:text-neutral-300">{totalResults}</span> of{' '}
                    <span className="font-semibold text-zinc-700 dark:text-neutral-300">{data.total}</span> petitions
                  </>
                ) : (
                  'No petitions found'
                )}
              </p>
            </div>

            {/* View toggle buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 hover:bg-zinc-200 dark:hover:bg-neutral-700'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 hover:bg-zinc-200 dark:hover:bg-neutral-700'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <SearchBar
            onSearch={handleSearch}
            onClear={handleClear}
            placeholder="Search petitions by title, topic, or cause..."
            showFilters={true}
            categories={uniqueCategories}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        {totalResults === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No petitions found</h2>
            <p className="text-zinc-500 dark:text-neutral-400 mb-6">
              Try adjusting your search filters or browse all categories
            </p>
            <button
              onClick={handleClear}
              className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Trending section - always at top if petitions exist */}
            {data.trending.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    🔥 Trending Now
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-neutral-400 mt-1">
                    Petitions gaining momentum this week
                  </p>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                  {data.trending.map((petition) => (
                    <motion.div key={petition.id} layout>
                      {viewMode === 'grid' ? (
                        <PetitionGridCard petition={petition} />
                      ) : (
                        <PetitionListItem petition={petition} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Category sections */}
            {Object.entries(filteredCategories).length > 0 && (
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([category, petitions], idx) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                  >
                    <PetitionCategorySection
                      category={category}
                      petitions={petitions}
                      isExpanded={expandedCategories.has(category)}
                      onToggle={() => toggleCategory(category)}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
