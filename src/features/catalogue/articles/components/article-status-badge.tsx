import { cn } from "@/lib/utils";
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_COLORS } from "../types";
import type { ArticleStatusType } from "../types";

interface ArticleStatusBadgeProps {
  status: ArticleStatusType;
  className?: string;
}

export function ArticleStatusBadge({ status, className }: ArticleStatusBadgeProps) {
  const { bg, text } = ARTICLE_STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        bg,
        text,
        className
      )}
    >
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}
