/**
 * Reusable skeleton placeholders for loading states.
 * Used by Suspense boundaries and explicit loading indicators.
 */

export function ModelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border/80 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted-bg" />
      <div className="p-3.5 md:p-4 space-y-2.5">
        <div className="h-4 bg-muted-bg rounded-md w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted-bg rounded-md w-16" />
          <div className="h-4 bg-muted-bg rounded-md w-12" />
        </div>
      </div>
    </div>
  );
}

export function ModelGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ModelDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 bg-muted-bg rounded w-48" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="aspect-square bg-muted-bg rounded-2xl" />
          <div className="space-y-4">
            <div className="h-3 bg-muted-bg rounded w-24" />
            <div className="h-8 bg-muted-bg rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-muted-bg rounded w-full" />
              <div className="h-3 bg-muted-bg rounded w-5/6" />
              <div className="h-3 bg-muted-bg rounded w-2/3" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="h-16 bg-muted-bg rounded-xl" />
              <div className="h-16 bg-muted-bg rounded-xl" />
              <div className="h-16 bg-muted-bg rounded-xl" />
              <div className="h-16 bg-muted-bg rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchHeaderSkeleton() {
  return (
    <div className="bg-white border-b border-border sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="h-12 bg-muted-bg rounded-xl max-w-2xl animate-pulse" />
      </div>
    </div>
  );
}
