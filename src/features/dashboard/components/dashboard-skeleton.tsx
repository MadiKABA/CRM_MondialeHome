import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="bg-cream-darker h-7 w-56" />
          <Skeleton className="bg-cream-darker h-4 w-40" />
        </div>
        <Skeleton className="bg-cream-darker h-9 w-48" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-cream-darker rounded-xl border bg-white p-5">
            <Skeleton className="bg-cream-darker mb-3 h-3 w-24" />
            <Skeleton className="bg-cream-darker mb-2 h-8 w-32" />
            <Skeleton className="bg-cream-darker h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-cream-darker h-72 rounded-xl border bg-white p-5 lg:col-span-2">
          <Skeleton className="bg-cream-darker mb-4 h-4 w-32" />
          <Skeleton className="bg-cream-darker h-52 w-full" />
        </div>
        <div className="border-cream-darker h-72 rounded-xl border bg-white p-5">
          <Skeleton className="bg-cream-darker mb-4 h-4 w-32" />
          <Skeleton className="bg-cream-darker mx-auto h-52 w-full rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="border-cream-darker rounded-xl border bg-white p-5">
            <Skeleton className="bg-cream-darker mb-4 h-4 w-24" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="border-cream-darker flex items-center gap-3 border-b py-2.5 last:border-0"
              >
                <Skeleton className="bg-cream-darker size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="bg-cream-darker h-3 w-32" />
                  <Skeleton className="bg-cream-darker h-3 w-20" />
                </div>
                <Skeleton className="bg-cream-darker h-4 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
