import { Skeleton } from "@/components/ui/skeleton";

export function CategoryTreeSkeleton() {
  return (
    <div className="border-cream-darker bg-card rounded-xl border">
      <div className="divide-cream-darker/50 divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-2"
            style={{ paddingLeft: `${8 + (i % 3) * 20}px` }}
          >
            <Skeleton className="size-5 shrink-0 rounded" />
            <Skeleton className="h-4 max-w-[180px] flex-1 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
