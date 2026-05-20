"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Tag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientsFiltersProps {
  cities: string[];
  sources: string[];
  tags?: string[];
  defaultSearch?: string;
  defaultCity?: string;
  defaultStatus?: string;
  defaultSource?: string;
  defaultTag?: string;
  defaultAssigned?: "me" | "all";
}

export function ClientsFilters({
  cities,
  sources,
  tags = [],
  defaultSearch = "",
  defaultCity = "",
  defaultStatus = "",
  defaultSource = "",
  defaultTag = "",
  defaultAssigned,
}: ClientsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  const hasFilters =
    defaultSearch ||
    defaultCity ||
    defaultStatus ||
    defaultSource ||
    defaultTag ||
    defaultAssigned;

  const reset = () => {
    startTransition(() => router.push(pathname));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Recherche texte */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="text-text-secondary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher un client…"
          defaultValue={defaultSearch}
          onChange={(e) => updateParam("search", e.target.value)}
          className="border-border bg-background pl-9"
        />
      </div>

      {/* Filtre ville */}
      <Select
        value={defaultCity || "__all__"}
        onValueChange={(v) => updateParam("city", !v || v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="border-border bg-background w-[150px]">
          <SelectValue placeholder="Ville" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Toutes les villes</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre statut */}
      <Select
        value={defaultStatus || "__all__"}
        onValueChange={(v) => updateParam("status", !v || v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="border-border bg-background w-[140px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous les statuts</SelectItem>
          <SelectItem value="ACTIVE">Actif</SelectItem>
          <SelectItem value="INACTIVE">Inactif</SelectItem>
          <SelectItem value="UNSUBSCRIBED">Désinscrit</SelectItem>
          <SelectItem value="BLACKLISTED">Blacklist</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtre source */}
      {sources.length > 0 && (
        <Select
          value={defaultSource || "__all__"}
          onValueChange={(v) => updateParam("source", !v || v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="border-border bg-background w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filtre tag */}
      {tags.length > 0 && (
        <Select
          value={defaultTag || "__all__"}
          onValueChange={(v) => updateParam("tag", !v || v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="border-border bg-background w-[140px]">
            <Tag className="size-3.5 shrink-0" />
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filtre assignation */}
      <Button
        variant={defaultAssigned === "me" ? "secondary" : "outline"}
        size="sm"
        className={
          defaultAssigned === "me"
            ? "border-gold-light bg-gold-light/30 text-gold-darker"
            : "border-cream-darker text-text-secondary hover:bg-cream"
        }
        onClick={() => updateParam("assigned", defaultAssigned === "me" ? "" : "me")}
      >
        <User className="size-3.5" />
        Mes clients
      </Button>

      {/* Réinitialiser */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-text-secondary hover:text-foreground"
        >
          <X className="size-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
