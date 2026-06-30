"use client";

import { cn } from "@/lib/utils";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  type CampaignStatus,
} from "../types";

const STATUS_ICONS: Record<CampaignStatus, string> = {
  DRAFT: "📝",
  SCHEDULED: "🕐",
  SENDING: "📤",
  SENT: "✅",
  PAUSED: "⏸️",
  CANCELLED: "🚫",
  FAILED: "❌",
  COMPLETED: "🏁",
};

interface Props {
  status: CampaignStatus;
  size?: "sm" | "md";
}

export function CampaignStatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        CAMPAIGN_STATUS_COLORS[status],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span>{STATUS_ICONS[status]}</span>
      {CAMPAIGN_STATUS_LABELS[status]}
      {status === "SENDING" && (
        <span className="ml-0.5 size-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
    </span>
  );
}
