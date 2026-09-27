import { SkeletonGrid } from '../../components/skeleton-loader';

export default function PetitionsListLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <SkeletonGrid count={6} cols={3} />
    </main>
  );
}
