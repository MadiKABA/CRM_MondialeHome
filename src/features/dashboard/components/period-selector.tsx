"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Period } from "../types";

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

interface Props {
  current: Period;
}

export function PeriodSelector({ current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (period: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="bg-cream/50 border-cream-darker flex items-center gap-1 overflow-x-auto rounded-xl border p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleChange(p.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap",
            "transition-all duration-150",
            current === p.value
              ? "bg-gold-deep text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-cream"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
