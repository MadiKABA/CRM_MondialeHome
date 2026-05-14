"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
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

interface RoleOption {
  slug: string;
  name: string;
}

interface UsersFiltersProps {
  roles: RoleOption[];
}

export function UsersFilters({ roles }: UsersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search: string = searchParams.get("search") ?? "";
  const roleSlug: string = searchParams.get("role") ?? "";
  const status: string = searchParams.get("status") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasFilters = search || roleSlug || status;

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Recherche */}
      <div className="relative min-w-64 flex-1">
        <Search className="text-text-secondary absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher un membre..."
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 0 || val.length >= 2) {
              updateParams({ search: val });
            }
          }}
          className="border-cream-darker bg-cream/50 pl-9 text-sm"
        />
      </div>

      {/* Filtre par profil */}
      <Select
        value={roleSlug || "all"}
        onValueChange={(v) => updateParams({ role: !v || v === "all" ? "" : v })}
      >
        <SelectTrigger className="border-cream-darker bg-cream/50 w-48 text-sm">
          <SelectValue placeholder="Tous les profils" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les profils</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.slug} value={role.slug}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtre par statut */}
      <Select
        value={status || "all"}
        onValueChange={(v) => updateParams({ status: !v || v === "all" ? "" : v })}
      >
        <SelectTrigger className="border-cream-darker bg-cream/50 w-40 text-sm">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actifs</SelectItem>
          <SelectItem value="inactive">Désactivés</SelectItem>
        </SelectContent>
      </Select>

      {/* Réinitialiser */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-text-secondary hover:text-text-primary gap-1.5 text-sm"
        >
          <X className="size-3.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
