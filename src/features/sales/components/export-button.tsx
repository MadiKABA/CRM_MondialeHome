"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCsv, exportToExcel, exportToPdf, downloadBlob } from "../lib/export";
import type { SaleListItemDTO } from "../types";

interface ExportButtonProps {
  fetchData: () => Promise<SaleListItemDTO[]>;
}

export function ExportButton({ fetchData }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  async function handleExport(format: "csv" | "xlsx" | "pdf") {
    startTransition(async () => {
      try {
        const sales = await fetchData();
        const date = new Date().toISOString().slice(0, 10);

        if (format === "csv") {
          const blob = exportToCsv(sales);
          downloadBlob(blob, `ventes-${date}.csv`);
        } else if (format === "xlsx") {
          const blob = exportToExcel(sales);
          downloadBlob(blob, `ventes-${date}.xlsx`);
        } else {
          const blob = await exportToPdf(sales);
          downloadBlob(blob, `ventes-${date}.pdf`);
        }

        toast.success(`Export ${format.toUpperCase()} prêt`);
      } catch {
        toast.error("Erreur lors de l'export");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void handleExport("csv")}>
          Exporter CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("xlsx")}>
          Exporter Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("pdf")}>
          Exporter PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
