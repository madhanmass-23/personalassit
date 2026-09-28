import { Skeleton } from "@/components/ui/skeleton";

export function MoneySkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full" aria-busy="true" aria-label="Loading financial data">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-4 w-60 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* Financial Summary Card Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>

      {/* Today Spending Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-xs">
        <Skeleton className="h-4 w-32 rounded-md" />
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>

      {/* Transaction List Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
