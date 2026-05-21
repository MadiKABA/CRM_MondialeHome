"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportArticles } from "../server/actions";
import type { ArticleListItemDTO } from "../types";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-SN").format(price);
}

async function exportToCSV(articles: ArticleListItemDTO[], _canViewCost: boolean) {
  const { unparse } = await import("papaparse");

  const rows = articles.map((a) => ({
    Référence: a.reference,
    "Code-barres": a.barcode ?? "",
    Nom: a.name,
    Catégorie: a.categoryPath ?? a.categoryName ?? "",
    Marque: a.brand ?? "",
    "Prix (XOF)": formatPrice(a.price),
    "Prix promo (XOF)": a.promoPrice ? formatPrice(a.promoPrice) : "",
    Stock: a.stock,
    "Seuil alerte": a.stockAlert,
    Statut: a.status,
    Nouveauté: a.isNew ? "Oui" : "Non",
    Tags: a.tags.join(", "),
  }));

  const csv = unparse(rows, { delimiter: ";", header: true });
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `catalogue-articles-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportToXLSX(articles: ArticleListItemDTO[], _canViewCost: boolean) {
  const XLSX = await import("xlsx");

  const rows = articles.map((a) => ({
    Référence: a.reference,
    "Code-barres": a.barcode ?? "",
    Nom: a.name,
    Catégorie: a.categoryPath ?? a.categoryName ?? "",
    Marque: a.brand ?? "",
    "Prix (XOF)": a.price,
    "Prix promo (XOF)": a.promoPrice ?? "",
    Stock: a.stock,
    "Seuil alerte": a.stockAlert,
    Statut: a.status,
    Nouveauté: a.isNew ? "Oui" : "Non",
    Tags: a.tags.join(", "),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Articles");
  XLSX.writeFile(wb, `catalogue-articles-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

interface ExportButtonProps {
  canViewCost?: boolean;
}

export function ExportButton({ canViewCost = false }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      setIsLoading(true);
      const result = await exportArticles({});
      if (!result.success) throw new Error(result.error);
      const articles = result.data?.articles ?? [];
      if (format === "csv") {
        await exportToCSV(articles, canViewCost);
      } else {
        await exportToXLSX(articles, canViewCost);
      }
      toast.success(
        `Export ${format.toUpperCase()} téléchargé (${articles.length} articles)`
      );
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={isLoading} className="gap-2">
            <Download className="size-4" />
            {isLoading ? "Export…" : "Exporter"}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="size-4" />
          CSV (Excel/LibreOffice)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="size-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
