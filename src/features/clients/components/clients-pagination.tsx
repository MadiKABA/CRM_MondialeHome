"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function ClientsPagination({
  page,
  totalPages,
  total,
  limit,
}: ClientsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const go = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const setLimit = (newLimit: string | null) => {
    if (!newLimit) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-text-secondary text-sm">
        {total === 0
          ? "Aucun résultat"
          : `${from}–${to} sur ${total.toLocaleString("fr-FR")} clients`}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Select value={String(limit)} onValueChange={setLimit}>
            <SelectTrigger className="border-border h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-text-secondary text-xs">par page</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="border-border h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => go(page - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm tabular-nums">
            {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-border h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => go(page + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
