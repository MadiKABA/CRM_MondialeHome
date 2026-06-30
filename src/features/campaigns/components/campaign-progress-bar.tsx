"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  sentCount: number;
  totalCount: number;
  status: string;
}

export function CampaignProgressBar({ sentCount, totalCount, status }: Props) {
  const router = useRouter();
  const pct = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (status !== "SENDING") return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [status, router]);

  if (status !== "SENDING") return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
          <span className="size-2 animate-pulse rounded-full bg-amber-500" />
          Envoi en cours...
        </p>
        <p className="text-xs text-amber-700">
          {sentCount} / {totalCount}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-amber-200/50">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
