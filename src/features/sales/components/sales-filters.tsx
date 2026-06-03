"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { SALE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "../types";
import { SALE_STATUSES, PAYMENT_METHODS } from "../schemas/sale.schema";

export function SalesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const method = searchParams.get("paymentMethod") ?? undefined;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const hasFilters = !!(search ?? status ?? method);

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-60 flex-1">
        <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input
          placeholder="Référence, client, téléphone..."
          defaultValue={search}
          onChange={(e) => update("search", e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status ?? ""}
        onValueChange={(v) => update("status", v === "all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {SALE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {SALE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={method ?? ""}
        onValueChange={(v) => update("paymentMethod", v === "all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Paiement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes méthodes</SelectItem>
          {PAYMENT_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
          <X className="size-3.5" />
          Effacer
        </Button>
      )}
    </div>
  );
}
