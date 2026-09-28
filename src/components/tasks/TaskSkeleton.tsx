import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full" aria-busy="true" aria-label="Loading tasks">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs"
        >
          {/* Checkbox skeleton */}
          <Skeleton className="h-6 w-6 rounded-full shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title skeleton */}
            <Skeleton className="h-4.5 w-3/4 max-w-xs rounded-md" />
            
            {/* Metadata badges skeleton */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>

          {/* Action button skeleton */}
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}
