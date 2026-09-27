import { SkeletonLoader } from '../../../components/skeleton-loader';

export default function PollDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-neutral-800" />
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <SkeletonLoader variant="form-field" count={3} />
      </div>
    </main>
  );
}
