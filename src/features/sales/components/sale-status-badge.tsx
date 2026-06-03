import { cn } from "@/lib/utils";
import { SALE_STATUS_LABELS, SALE_STATUS_COLORS, type SaleStatusType } from "../types";

interface SaleStatusBadgeProps {
  status: SaleStatusType;
  className?: string;
}

export function SaleStatusBadge({ status, className }: SaleStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        SALE_STATUS_COLORS[status],
        className
      )}
    >
      {SALE_STATUS_LABELS[status]}
    </span>
  );
}
