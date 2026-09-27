import { SkeletonLoader } from '../../components/skeleton-loader';

export default function CreatePetitionLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <SkeletonLoader variant="form-field" count={2} />
          </div>
        ))}
      </div>
    </main>
  );
}
