"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABELS } from "../types";

export function CampaignsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/campagnes?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Rechercher une campagne..."
          className="border-cream-darker focus:border-gold pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => update("status", "")}
          className={cn(
            "border-cream-darker h-9 text-xs",
            !status
              ? "border-gold/40 bg-gold-light/40 text-gold-darker"
              : "hover:bg-cream"
          )}
        >
          Tous
        </Button>
        {CAMPAIGN_STATUSES.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            onClick={() => update("status", status === s ? "" : s)}
            className={cn(
              "border-cream-darker h-9 text-xs",
              status === s
                ? "border-gold/40 bg-gold-light/40 text-gold-darker"
                : "hover:bg-cream"
            )}
          >
            {CAMPAIGN_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>
    </div>
  );
}
