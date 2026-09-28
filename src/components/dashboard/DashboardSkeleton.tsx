import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in" aria-busy="true" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>

      {/* Today's Overview Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border bg-card/40 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2 w-12" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 min-h-[76px] rounded-2xl border bg-card/30 flex flex-col items-center justify-center gap-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Tasks & Money Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks Card Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-4 rounded-2xl border bg-card/40 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 border-border/40">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money Card Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-5 rounded-2xl border bg-card/40 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
