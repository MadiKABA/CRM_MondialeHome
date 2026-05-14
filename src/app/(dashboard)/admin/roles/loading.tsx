export default function RolesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="bg-cream-darker h-7 w-40 animate-pulse rounded-lg" />
          <div className="bg-cream-darker h-4 w-64 animate-pulse rounded-lg" />
        </div>
        <div className="bg-cream-darker h-8 w-32 animate-pulse rounded-lg" />
      </div>

      <div className="border-cream-darker bg-cream/40 rounded-xl border px-5 py-4">
        <div className="bg-cream-darker h-4 w-full animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-cream-darker rounded-xl border p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="bg-cream-darker size-10 animate-pulse rounded-full" />
              <div className="bg-cream-darker h-5 w-16 animate-pulse rounded-full" />
            </div>
            <div className="mb-4 space-y-2">
              <div className="bg-cream-darker h-5 w-32 animate-pulse rounded-lg" />
              <div className="bg-cream-darker h-3 w-full animate-pulse rounded-lg" />
              <div className="bg-cream-darker h-3 w-2/3 animate-pulse rounded-lg" />
            </div>
            <div className="bg-cream-darker h-7 w-full animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
