export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-border/60 sm:aspect-[4/5]" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-border/60" />
          <div className="h-5 w-20 animate-pulse rounded bg-border/60" />
        </div>

        <div className="h-9 w-3/4 animate-pulse rounded bg-border/70" />
        <div className="h-10 w-32 animate-pulse rounded bg-border/70" />

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={i === 4 ? "col-span-2" : ""}>
              <div className="h-3 w-16 animate-pulse rounded bg-border/50" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded bg-border/70" />
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <div className="h-11 w-36 animate-pulse rounded bg-border/70" />
          <div className="h-11 w-36 animate-pulse rounded bg-border/70" />
        </div>
      </div>
    </div>
  );
}
