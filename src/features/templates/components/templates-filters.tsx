"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMPAIGN_TYPES } from "../types";

export function TemplatesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) next.delete(key);
        else next.set(key, value);
      });
      next.delete("page");
      return next.toString();
    },
    [searchParams]
  );

  const handleSearch = (value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ search: value || null })}`, {
        scroll: false,
      });
    });
  };

  const handleCategory = (category: string) => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          category: currentCategory === category ? null : category,
        })}`,
        { scroll: false }
      );
    });
  };

  const hasActiveFilters = currentCategory || currentSearch;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Recherche */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            defaultValue={currentSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher un template..."
            className="border-cream-darker focus:border-gold pl-9 text-sm"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              startTransition(() => {
                router.push(pathname);
              })
            }
            className="text-text-muted hover:text-text-secondary gap-1.5 text-xs"
          >
            <SlidersHorizontal className="size-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Chips type de campagne */}
      <div className="flex flex-wrap gap-1.5">
        {CAMPAIGN_TYPES.map((type) => {
          const isActive = currentCategory === type;
          return (
            <button
              key={type}
              onClick={() => handleCategory(type)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                isActive
                  ? "bg-gold-deep border-gold-deep text-white"
                  : "border-cream-darker text-text-secondary hover:border-gold/50 hover:bg-cream"
              )}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
