import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <Icon className="size-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-heading text-foreground font-semibold">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-xs text-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
