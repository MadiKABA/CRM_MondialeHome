"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategorySelectOption } from "@/features/catalogue/categories/types";
import type { ArticleStatusType } from "../types";
import { ARTICLE_STATUS_LABELS } from "../types";

interface ArticlesFiltersProps {
  categories: CategorySelectOption[];
  brands: string[];
}

export function ArticlesFilters({ categories, brands }: ArticlesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("categoryId") ||
    searchParams.has("status") ||
    searchParams.has("brand");

  const resetFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs min-w-[200px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher…"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value || undefined)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("categoryId") ?? ""}
        onValueChange={(v) => updateParam("categoryId", v || undefined)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(v) => updateParam("status", v || undefined)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ARTICLE_STATUS_LABELS) as ArticleStatusType[]).map((s) => (
            <SelectItem key={s} value={s}>
              {ARTICLE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {brands.length > 0 && (
        <Select
          value={searchParams.get("brand") ?? ""}
          onValueChange={(v) => updateParam("brand", v || undefined)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Marque" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
          <X className="size-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
