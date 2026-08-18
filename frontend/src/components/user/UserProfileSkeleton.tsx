export function UserProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <div className="size-20 animate-pulse rounded-full bg-border/60" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-6 w-48 animate-pulse rounded bg-border/70" />
          <div className="h-4 w-32 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-border/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="aspect-[3/4] w-full animate-pulse bg-border/60" />
            <div className="flex flex-col gap-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-border/70" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-border/50" />
              <div className="mt-2 flex items-center justify-between">
                <div className="h-4 w-16 animate-pulse rounded bg-border/70" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-border/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
