import { cn } from "@/lib/utils";
import type { StockLevel } from "../types";

interface ArticleStockBadgeProps {
  stock: number;
  stockLevel: StockLevel;
  className?: string;
}

export function ArticleStockBadge({
  stock,
  stockLevel,
  className,
}: ArticleStockBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono text-sm font-medium",
        stockLevel === "empty" && "font-bold text-red-600",
        stockLevel === "low" && "font-semibold text-amber-600",
        stockLevel === "ok" && "text-muted-foreground",
        className
      )}
    >
      {stock}
    </span>
  );
}
