'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchFilters {
  query: string;
  category?: string;
  status?: 'all' | 'active' | 'closed' | 'won';
  location?: string;
  sortBy?: 'trending' | 'newest' | 'most-signed';
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
  placeholder?: string;
  categories?: Array<{ value: string; label: string }>;
  locations?: Array<{ value: string; label: string }>;
  showFilters?: boolean;
}

const defaultCategories = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'justice', label: 'Justice' },
  { value: 'environment', label: 'Environment' },
  { value: 'economy', label: 'Economy' },
  { value: 'other', label: 'Other' },
];

const defaultLocations = [
  { value: 'montserrado', label: 'Montserrado' },
  { value: 'lofa', label: 'Lofa' },
  { value: 'nimba', label: 'Nimba' },
  { value: 'bong', label: 'Bong' },
  { value: 'margibi', label: 'Margibi' },
  { value: 'grand-cape-mount', label: 'Grand Cape Mount' },
  { value: 'river-gee', label: 'River Gee' },
  { value: 'grand-gedeh', label: 'Grand Gedeh' },
  { value: 'sinoe', label: 'Sinoe' },
  { value: 'grand-kru', label: 'Grand Kru' },
  { value: 'county-line', label: 'County Line' },
  { value: 'rivercess', label: 'Rivercess' },
];

export function SearchBar({
  onSearch,
  onClear,
  placeholder = 'Search petitions...',
  categories = defaultCategories,
  locations = defaultLocations,
  showFilters = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'closed' | 'won'>('all');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'most-signed'>('trending');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch({
      query,
      category: category || undefined,
      status: status === 'all' ? undefined : status,
      location: location || undefined,
      sortBy,
    });
  }, [query, category, status, location, sortBy, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setCategory('');
    setStatus('all');
    setLocation('');
    setSortBy('trending');
    onClear?.();
  }, [onClear]);

  const hasActiveFilters = query || category || status !== 'all' || location;

  return (
    <div className="w-full space-y-3">
      {/* Main Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            onClick={handleSearch}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition active:scale-95 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 outline-none"
          >
            Search
          </button>

          {showFilters && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 md:px-4 py-2.5 md:py-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition focus:ring-2 focus:ring-emerald-500 outline-none"
              title="Advanced filters"
            >
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'closed' | 'won')}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="won">Won</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  County
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Counties</option>
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'trending' | 'newest' | 'most-signed')}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="trending">Trending</option>
                  <option value="newest">Newest</option>
                  <option value="most-signed">Most Signed</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition active:scale-95"
                >
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleClear}
                    className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
