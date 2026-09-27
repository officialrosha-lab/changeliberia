import { SkeletonLoader } from '../../components/skeleton-loader';

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
        ))}
      </div>
      <SkeletonLoader variant="list-item" count={4} />
    </main>
  );
}
