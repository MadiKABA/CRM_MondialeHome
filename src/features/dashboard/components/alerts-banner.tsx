"use client";

import { useState } from "react";
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardAlert } from "../types";

interface Props {
  alerts: DashboardAlert[];
}

const ICON_MAP = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
} as const;

const COLOR_MAP: Record<DashboardAlert["type"], string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
};

export function AlertsBanner({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => {
        if (dismissed.has(index)) return null;
        const Icon = ICON_MAP[alert.type];

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3",
              COLOR_MAP[alert.type]
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-0.5 text-xs opacity-80">{alert.message}</p>
              {alert.action && (
                <Link
                  href={alert.action.href}
                  className="mt-1 inline-block text-xs font-medium underline"
                >
                  {alert.action.label} →
                </Link>
              )}
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, index]))}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              aria-label="Fermer cette alerte"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
