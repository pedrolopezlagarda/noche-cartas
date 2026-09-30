import { Skeleton } from "./ui/skeleton";

export function AuthLayoutSkeleton() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/40">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <div className="grid gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="flex items-center justify-around h-16 border-t border-border/40">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}
