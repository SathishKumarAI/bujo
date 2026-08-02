/**
 * Loading placeholders. A skeleton that mirrors the shape of the content it is
 * standing in for reads as "almost there"; a centred spinner or a "Loading…"
 * line reads as "nothing is happening".
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface0 ${className}`} />
}

/** One card's worth of placeholder: a title line and a few body lines. */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface1 bg-mantle p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  )
}

/** The fallback a lazily-loaded view shows while its chunk downloads. */
export function SkeletonView({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading view</span>
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
