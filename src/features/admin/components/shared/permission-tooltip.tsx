"use client";

import type { ReactNode } from "react";
import { Info, AlertTriangle, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPermissionLabel } from "@/features/admin/lib/permission-labels";
import { PERMISSION_LABELS } from "@/features/admin/lib/permission-labels";
import type { PermissionCode } from "@/lib/permissions";

interface PermissionTooltipProps {
  code: string;
  children: ReactNode;
}

export function PermissionTooltip({ code, children }: PermissionTooltipProps) {
  const meta = PERMISSION_LABELS[code as PermissionCode];

  if (!meta) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent className="max-w-64 space-y-1.5 p-3" side="top">
          <div className="flex items-start gap-2">
            {meta.superAdminOnly ? (
              <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            ) : meta.isDangerous ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            ) : (
              <Info className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
            )}
            <div className="space-y-1">
              <p className="text-xs leading-tight font-semibold">{meta.label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {meta.description}
              </p>
              {meta.example && (
                <p className="text-muted-foreground border-cream-darker mt-1 border-t pt-1 text-[11px] italic">
                  Ex : {meta.example}
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PermissionLabelWithTooltip({ code }: { code: string }) {
  return (
    <PermissionTooltip code={code}>
      <span className="cursor-help underline decoration-dashed decoration-1 underline-offset-2">
        {getPermissionLabel(code)}
      </span>
    </PermissionTooltip>
  );
}
