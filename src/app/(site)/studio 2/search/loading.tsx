import { SearchHeaderSkeleton, ModelGridSkeleton } from '@/components/ui/Skeletons';

export default function SearchLoading() {
  return (
    <div className="animate-fade-in">
      <SearchHeaderSkeleton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <aside className="md:w-56 shrink-0">
            <div className="hidden md:block space-y-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 bg-muted-bg rounded-xl animate-pulse" />
              ))}
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-muted-bg rounded w-32 mb-5 animate-pulse" />
            <ModelGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

