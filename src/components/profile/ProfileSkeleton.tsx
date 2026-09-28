import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 max-w-xl mx-auto w-full py-2"
      aria-busy="true"
      aria-label="Loading profile"
    >
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 p-4 rounded-3xl border bg-card/60">
        <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-4 w-56 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
      </div>

      {/* Profile Details Card Skeleton */}
      <div className="rounded-3xl border bg-card/60 p-5 space-y-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Appearance Card Skeleton */}
      <div className="rounded-3xl border bg-card/60 p-5 space-y-4">
        <Skeleton className="h-5 w-28 rounded-md" />
        <div className="grid grid-cols-3 gap-2.5">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>

      {/* Preferences Skeleton */}
      <div className="rounded-3xl border bg-card/60 p-5 space-y-4">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Logout button skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
