export default function RootLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <div className="mx-auto mt-4 h-4 w-96 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-neutral-800" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-neutral-800" />
        ))}
      </div>
    </main>
  );
}
