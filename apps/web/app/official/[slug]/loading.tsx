import { SkeletonLoader } from '../../../components/skeleton-loader';

export default function OfficialProfileLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-neutral-800" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="mt-8">
        <SkeletonLoader variant="text-block" count={2} />
      </div>
    </main>
  );
}
