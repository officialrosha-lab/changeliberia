import { SkeletonLoader } from '../../../components/skeleton-loader';
import { Card } from '../../../components/ui/card';

export default function PetitionDetailLoading() {
  return (
    <main className="min-h-screen pb-28 bg-zinc-50 dark:bg-neutral-950 md:pb-0">
      <div className="h-56 w-full bg-zinc-200 dark:bg-neutral-800 sm:h-72 md:h-80 animate-pulse" />
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-8 lg:gap-10">
          <div className="space-y-5">
            <Card rounded="3xl" className="p-6">
              <SkeletonLoader variant="text-block" />
            </Card>
            <Card rounded="3xl" className="p-6">
              <SkeletonLoader variant="text-block" count={2} />
            </Card>
          </div>
          <div className="space-y-4">
            <Card rounded="3xl" className="p-5">
              <SkeletonLoader variant="form-field" count={2} />
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
