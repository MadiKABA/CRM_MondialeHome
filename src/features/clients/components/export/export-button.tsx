"use client";

import { useState } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getClientsExportData } from "../../server/actions";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/export";
import type { ClientListItemDTO, ExportFormat } from "../../types";

interface ExportButtonProps {
  count: number;
  filters?: Record<string, string>;
}

export function ExportButton({ count, filters = {} }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    try {
      const result = await getClientsExportData({
        search: filters.search || undefined,
        city: filters.city || undefined,
        status: filters.status as
          | "ACTIVE"
          | "INACTIVE"
          | "UNSUBSCRIBED"
          | "BLACKLISTED"
          | undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const clients = (result.data ?? []) as ClientListItemDTO[];
      const filename = `clients_${new Date().toISOString().slice(0, 10)}`;

      if (format === "csv") exportToCSV(clients, filename);
      else if (format === "excel") exportToExcel(clients, filename);
      else await exportToPDF(clients, filename);

      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={loading}
            className="border-cream-darker bg-background text-text-secondary hover:bg-cream"
          />
        }
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Exporter
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="size-4" />
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="size-4" />
          Exporter en Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="size-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="text-text-secondary px-2 py-1 text-xs">
          {count.toLocaleString("fr-FR")} clients · filtres appliqués
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
