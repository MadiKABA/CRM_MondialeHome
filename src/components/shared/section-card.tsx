import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-card border-border rounded-xl border shadow-xs",
        "p-6 md:p-8",
        className
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-heading text-foreground text-lg font-semibold">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
