import { Skeleton } from "@/components/ui/skeleton";

export function VaultInitSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] max-w-md mx-auto p-6 space-y-6">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <div className="space-y-2 text-center w-full">
        <Skeleton className="h-7 w-44 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-64 mx-auto rounded-md" />
      </div>
      <div className="w-full space-y-3 pt-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function VaultEntryListSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-border/60 bg-card/40 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
