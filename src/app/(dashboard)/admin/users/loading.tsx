export default function UsersLoading() {
  return (
    <div className="space-y-8">
      {/* En-tête skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="bg-cream-darker h-7 w-48 animate-pulse rounded-lg" />
          <div className="bg-cream-darker h-4 w-72 animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="bg-cream-darker h-8 w-28 animate-pulse rounded-lg" />
          <div className="bg-cream-darker h-8 w-36 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-cream-darker rounded-xl border p-5">
            <div className="bg-cream-darker mb-3 h-9 w-9 animate-pulse rounded-full" />
            <div className="bg-cream-darker mb-2 h-7 w-12 animate-pulse rounded-lg" />
            <div className="bg-cream-darker h-3 w-24 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border-cream-darker rounded-xl border">
        <div className="bg-cream/40 border-cream-darker border-b px-4 py-3">
          <div className="bg-cream-darker h-4 w-full animate-pulse rounded-lg" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-cream-darker flex items-center gap-4 border-b px-4 py-3"
          >
            <div className="bg-cream-darker size-9 animate-pulse rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="bg-cream-darker h-4 w-36 animate-pulse rounded-lg" />
              <div className="bg-cream-darker h-3 w-48 animate-pulse rounded-lg" />
            </div>
            <div className="bg-cream-darker h-5 w-20 animate-pulse rounded-full" />
            <div className="bg-cream-darker h-5 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
