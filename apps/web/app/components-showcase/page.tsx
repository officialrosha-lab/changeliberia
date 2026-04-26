'use client';

import { useState } from 'react';
import { Breadcrumb } from '../../components/breadcrumb';
import { SearchBar, type SearchFilters } from '../../components/search-bar';
import { EmptyState, EmptyStateUserPetitions, EmptyStateDashboard } from '../../components/empty-state';
import { SkeletonLoader, SkeletonGrid } from '../../components/skeleton-loader';
import { LoadingButton } from '../../components/loading-button';
import { useToast } from '../../lib/toast-context';

export default function ComponentShowcase() {
  const { show: showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '' });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    showToast(`Searching for: ${filters.query || 'all'}`, 'info');
  };

  const handleLoadingClick = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Action completed successfully!', 'success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            Phase 1 Quick Wins Components
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Showcasing all newly implemented UI components for testing and verification
          </p>
        </div>

        {/* Breadcrumb Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Breadcrumb Navigation</h2>
          <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Petitions', href: '/petitions' },
                { label: 'Healthcare Reform', current: true },
              ]}
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Breadcrumb auto-generates from pathname or accepts custom items
            </p>
          </div>
        </section>

        {/* Search Bar Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Search Bar with Filters</h2>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Try searching for a petition..."
              showFilters={true}
            />
            {searchFilters.query && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950 rounded text-sm text-emerald-800 dark:text-emerald-200">
                Current search: <strong>{searchFilters.query}</strong>
              </div>
            )}
          </div>
        </section>

        {/* Empty States Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Empty State Components</h2>
          <div className="space-y-8">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">User Petitions Empty State</h3>
              <EmptyStateUserPetitions />
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Dashboard Empty State</h3>
              <EmptyStateDashboard />
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Custom Empty State</h3>
              <EmptyState
                icon="⚡"
                title="Feature Coming Soon"
                description="This feature is under development. Check back soon for updates!"
              />
            </div>
          </div>
        </section>

        {/* Skeleton Loaders Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Skeleton Loaders</h2>
          <div className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Petition Card Skeleton (3 items)</h3>
              <SkeletonLoader variant="petition-card" count={3} className="space-y-4" />
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">List Item Skeleton (2 items)</h3>
              <SkeletonLoader variant="list-item" count={2} className="space-y-3" />
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Grid of Petition Skeletons</h3>
              <SkeletonGrid count={6} cols={3} />
            </div>
          </div>
        </section>

        {/* Loading Button Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Loading Button Component</h2>
          <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Primary Button</h3>
              <LoadingButton
                isLoading={isLoading}
                onClick={handleLoadingClick}
                loadingText="Submitting..."
              >
                Click to Test Loading State
              </LoadingButton>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Sizes & Variants</h3>
              <div className="flex flex-wrap gap-3">
                <LoadingButton size="sm" variant="primary">
                  Small
                </LoadingButton>
                <LoadingButton size="md" variant="secondary">
                  Medium
                </LoadingButton>
                <LoadingButton size="lg" variant="danger">
                  Large Danger
                </LoadingButton>
              </div>
            </div>
          </div>
        </section>

        {/* Toast Notifications Section */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Toast Notifications</h2>
          <div className="space-y-3 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Click buttons below to trigger toast notifications (appears in bottom-right)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => showToast('This is a success message!', 'success')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Success Toast
              </button>
              <button
                onClick={() => showToast('An error occurred!', 'error')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Error Toast
              </button>
              <button
                onClick={() => showToast('This is a warning!', 'warning')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Warning Toast
              </button>
              <button
                onClick={() => showToast('FYI: This is informational', 'info')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Info Toast
              </button>
            </div>
          </div>
        </section>

        {/* Implementation Notes */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Implementation Notes</h2>
          <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100 space-y-2">
            <p>✅ All components are TypeScript-strict and React 19 compatible</p>
            <p>✅ Dark mode support verified on all components</p>
            <p>✅ Mobile-responsive with Tailwind CSS breakpoints</p>
            <p>✅ Animations use Framer Motion for smooth transitions</p>
            <p>✅ Accessibility features: focus indicators, ARIA labels, keyboard navigation</p>
            <p>✅ Toast system globally available via `useToast()` hook</p>
            <p>📝 Next step: Integrate into actual app pages and test with real data</p>
          </div>
        </section>
      </div>
    </div>
  );
}
