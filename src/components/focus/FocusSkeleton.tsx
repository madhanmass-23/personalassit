import { Skeleton } from "@/components/ui/skeleton";

export function FocusSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto py-4" aria-busy="true" aria-label="Loading focus data">
      {/* Header Skeleton */}
      <div className="text-center space-y-2 w-full">
        <Skeleton className="h-8 w-32 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-72 mx-auto rounded-md" />
      </div>

      {/* Timer Circle Skeleton */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-border/40 p-4">
        <Skeleton className="w-56 h-56 rounded-full" />
      </div>

      {/* Button Skeleton */}
      <Skeleton className="h-14 w-48 rounded-full" />

      {/* Today Summary Skeleton */}
      <div className="grid grid-cols-2 gap-4 w-full pt-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
