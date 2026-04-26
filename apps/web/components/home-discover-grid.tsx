'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FadeInOnScroll } from './scroll-animations';
import { SearchBar, type SearchFilters } from './search-bar';
import { EmptyStatePetitions } from './empty-state';
import { useToast } from '../lib/toast-context';

export type HomePetition = {
  id: string;
  title: string;
  summary: string;
  signaturesCount: number;
  todaySignatures: number;
  imageUrl?: string | null;
  category?: string | null;
};

function getMomentumLabel(todaySignatures: number): string {
  if (todaySignatures >= 100) return 'Trending now';
  if (todaySignatures >= 25) return 'Growing today';
  if (todaySignatures > 0) return 'Active campaign';
  return 'Needs support';
}

const CATEGORIES: { id: string; label: string; keywords: string[] }[] = [
  { id: 'all', label: 'All causes', keywords: [] },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    keywords: ['road', 'bridge', 'electric', 'water', 'drain', 'street', 'transport'],
  },
  {
    id: 'education',
    label: 'Education',
    keywords: ['school', 'student', 'teacher', 'university', 'education', 'literacy'],
  },
  {
    id: 'health',
    label: 'Health',
    keywords: ['health', 'hospital', 'clinic', 'ebola', 'malaria', 'nurse', 'doctor'],
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    keywords: ['farm', 'farmer', 'crop', 'rubber', 'cocoa', 'fisher', 'rural'],
  },
  {
    id: 'governance',
    label: 'Governance',
    keywords: ['ministry', 'government', 'transparency', 'election', 'law', 'justice'],
  },
  {
    id: 'youth',
    label: 'Youth & Jobs',
    keywords: ['youth', 'young', 'graduate', 'job', 'apprentice'],
  },
  {
    id: 'environment',
    label: 'Environment',
    keywords: ['environment', 'forest', 'pollution', 'climate', 'waste', 'nature'],
  },
  {
    id: 'women',
    label: 'Women & Gender',
    keywords: ['women', 'gender', 'girl', 'maternal', 'domestic', 'equality'],
  },
  {
    id: 'human-rights',
    label: 'Human Rights',
    keywords: ['rights', 'freedom', 'prison', 'police', 'abuse', 'corruption'],
  },
];

function matchesCategory(p: HomePetition, categoryId: string): boolean {
  if (categoryId === 'all') return true;
  // Prefer the stored category field; fall back to keyword matching for older petitions
  if (p.category) return p.category === categoryId;
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat?.keywords.length) return true;
  const blob = `${p.title} ${p.summary}`.toLowerCase();
  return cat.keywords.some((k) => blob.includes(k));
}

export function HomeDiscoverGrid({ petitions }: { petitions: HomePetition[] }) {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'trending',
  });
  const { show: showToast } = useToast();

  const filtered = useMemo(() => {
    let results = petitions;

    // Filter by search query
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.summary.toLowerCase().includes(query),
      );
    }

    // Filter by category
    if (searchFilters.category && searchFilters.category !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === searchFilters.category);
      results = results.filter((p) => matchesCategory(p, searchFilters.category || 'all'));
    }

    // Filter by status
    if (searchFilters.status && searchFilters.status !== 'all') {
      // TODO: Add status field to petitions when available in API
      // For now, use momentum heuristic
      if (searchFilters.status === 'active') {
        results = results.filter((p) => p.todaySignatures > 0);
      }
    }

    // Filter by location
    if (searchFilters.location) {
      // TODO: Add location field to petitions when available in API
      // For now, skip location filtering
    }

    // Sort results
    const sorted = [...results];
    switch (searchFilters.sortBy) {
      case 'newest':
        // NOTE: API would need to return createdAt timestamp
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
  }, [petitions, searchFilters]);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    if (filters.query) {
      showToast(`Found ${filtered.length} petitions`, 'info');
    }
  };

  const handleClear = () => {
    setSearchFilters({
      query: '',
      sortBy: 'trending',
    });
  }

  return (
    <FadeInOnScroll>
      <section id="petitions-discovery" className="bg-white dark:bg-black section-spacing">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-3">
              Active campaigns
            </p>
            <h2 className="headline-serif text-4xl lg:text-5xl text-black dark:text-white mb-2">
              Discover causes
            </h2>
            <p className="text-base text-zinc-500 dark:text-neutral-400 mb-6">
              Petitions gaining momentum across Liberia
            </p>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClear}
              placeholder="Search petitions by title, topic, or cause..."
              showFilters={true}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyStatePetitions />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((petition) => (
              <Link
                key={petition.id}
                href={`/petitions/${petition.id}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-zinc-300 dark:hover:border-neutral-600 hover:shadow-md transition-all"
              >
                {/* Fixed-ratio image — every card identical height */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-neutral-800 flex-shrink-0">
                  {petition.imageUrl ? (
                    <Image
                      src={petition.imageUrl}
                      alt={petition.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-8 w-8 text-zinc-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card body — flex-col so footer always sticks to bottom */}
                <div className="flex flex-col flex-1 p-3 gap-1.5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug break-words">
                    {petition.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 line-clamp-2 flex-1">
                    {petition.summary}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-neutral-800 mt-auto">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {petition.signaturesCount.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-neutral-500">signatures</span>
                    <span className="ml-auto text-xs text-zinc-400 dark:text-neutral-500 truncate">
                      {getMomentumLabel(petition.todaySignatures)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            </div>
          )}
        </div>
      </section>
    </FadeInOnScroll>
  );
}
