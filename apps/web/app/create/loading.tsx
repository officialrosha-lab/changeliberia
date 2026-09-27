import { SkeletonLoader } from '../../components/skeleton-loader';
import { Card } from '../../components/ui/card';

export default function CreatePetitionLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} rounded="2xl" className="bg-zinc-50 p-5">
            <SkeletonLoader variant="form-field" count={2} />
          </Card>
        ))}
      </div>
    </main>
  );
}
