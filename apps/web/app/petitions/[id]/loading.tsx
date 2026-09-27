import { SkeletonLoader } from '../../../components/skeleton-loader';

export default function PetitionDetailLoading() {
  return (
    <main className="min-h-screen pb-28 bg-zinc-50 dark:bg-neutral-950 md:pb-0">
      <div className="h-56 w-full bg-zinc-200 dark:bg-neutral-800 sm:h-72 md:h-80 animate-pulse" />
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-8 lg:gap-10">
          <div className="space-y-5">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <SkeletonLoader variant="text-block" />
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <SkeletonLoader variant="text-block" count={2} />
            </div>
          </div>
          <div className="space-y-4">
            <SkeletonLoader variant="form-field" count={2} className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900" />
          </div>
        </div>
      </div>
    </main>
  );
}
