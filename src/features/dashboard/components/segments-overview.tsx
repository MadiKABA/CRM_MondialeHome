import Link from "next/link";
import { Layers } from "lucide-react";
import type { SegmentStat } from "../types";

interface Props {
  segments: SegmentStat[];
}

export function SegmentsOverview({ segments }: Props) {
  if (segments.length === 0) return null;

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="text-gold-deep size-4" />
          <h3 className="text-text-primary text-sm font-semibold">Segments actifs</h3>
        </div>
        <Link
          href="/segments"
          className="text-gold-deep hover:text-gold-darker text-xs transition-colors"
        >
          Gérer →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {segments.map((segment) => (
          <Link
            key={segment.id}
            href={`/segments/${segment.id}`}
            className="border-cream-darker hover:border-gold/40 hover:bg-cream/30 flex flex-col items-center rounded-lg border p-3 text-center transition-all"
          >
            <span className="mb-1 text-xl">{segment.icon ?? "👥"}</span>
            <p className="text-text-primary w-full truncate text-xs font-medium">
              {segment.name}
            </p>
            <p className="mt-0.5 text-lg font-bold" style={{ color: segment.color }}>
              {segment.memberCount.toLocaleString("fr-FR")}
            </p>
            <p className="text-text-muted text-[10px]">clients</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
