import { SkeletonLoader } from '../../../components/skeleton-loader';
import { Card } from '../../../components/ui/card';

export default function PollDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-neutral-800" />
      <Card rounded="2xl" className="mt-6 p-5">
        <SkeletonLoader variant="form-field" count={3} />
      </Card>
    </main>
  );
}
