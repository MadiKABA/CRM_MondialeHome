"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MappedArticleRow } from "../../lib/import-mapper";
import { importArticles, type ImportArticlesResult } from "../../server/import-actions";

function formatPrice(price: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price) + " FCFA"
  );
}

type FilterType = "all" | "valid" | "duplicates" | "errors" | "warnings";

interface StepPreviewProps {
  rows: MappedArticleRow[];
  onBack: () => void;
  onResult: (result: ImportArticlesResult) => void;
}

export function StepPreview({ rows, onBack, onResult }: StepPreviewProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const PAGE_SIZE = 25;

  const valid = rows.filter((r) => r.isValid && r.warnings.length === 0);
  const duplicates = rows.filter(
    (r) => r.isValid && r.warnings.some((w) => w.includes("existe déjà"))
  );
  const withWarnings = rows.filter((r) => r.isValid && r.warnings.length > 0);
  const withErrors = rows.filter((r) => !r.isValid);

  const filteredRows =
    filter === "valid"
      ? rows.filter((r) => r.isValid && r.warnings.length === 0)
      : filter === "duplicates"
        ? duplicates
        : filter === "errors"
          ? withErrors
          : filter === "warnings"
            ? withWarnings
            : rows;

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const importableCount = rows.filter((r) => r.isValid).length;

  const handleImport = () => {
    startTransition(async () => {
      const result = await importArticles(rows);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'import");
        return;
      }
      if (result.data) {
        toast.success(
          `Import terminé : ${result.data.created} créés, ${result.data.updated} mis à jour`
        );
        onResult(result.data);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Vérification</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Étape 3 sur 4 — Vérifiez les données avant d&apos;importer
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          count={rows.filter((r) => r.isValid && r.warnings.length === 0).length}
          label="valides"
          color="green"
        />
        <SummaryCard count={duplicates.length} label="doublons (màj)" color="blue" />
        <SummaryCard count={withWarnings.length} label="avertissements" color="amber" />
        <SummaryCard count={withErrors.length} label="erreurs" color="red" />
      </div>

      {/* Filtres et pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as FilterType);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les lignes ({rows.length})</SelectItem>
            <SelectItem value="valid">Valides ({valid.length})</SelectItem>
            <SelectItem value="duplicates">Doublons ({duplicates.length})</SelectItem>
            <SelectItem value="warnings">
              Avertissements ({withWarnings.length})
            </SelectItem>
            <SelectItem value="errors">Erreurs ({withErrors.length})</SelectItem>
          </SelectContent>
        </Select>

        {totalPages > 1 && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredRows.length)} sur {filteredRows.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </Button>
          </div>
        )}
      </div>

      {/* Table de prévisualisation */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="w-8 px-3 py-3 text-center font-medium" />
                <th className="px-3 py-3 text-left font-medium">Réf.</th>
                <th className="px-3 py-3 text-left font-medium">Nom</th>
                <th className="px-3 py-3 text-right font-medium">Prix</th>
                <th className="px-3 py-3 text-right font-medium">Stock</th>
                <th className="px-3 py-3 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedRows.map((row) => (
                <PreviewRow key={`${row.rowIndex}-${row.reference}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRows.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucune ligne pour ce filtre.
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={isPending} className="gap-2">
          <ChevronLeft className="size-4" />
          Retour
        </Button>

        <Button
          onClick={handleImport}
          disabled={isPending || importableCount === 0}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Import en cours…
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              Importer {importableCount.toLocaleString("fr")} article
              {importableCount > 1 ? "s" : ""} valide
              {importableCount > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: "green" | "blue" | "amber" | "red";
}) {
  const styles = {
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-950/20 dark:text-green-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-400",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400",
  };

  return (
    <div className={`rounded-lg border p-3 ${styles[color]}`}>
      <p className="text-2xl font-bold">{count.toLocaleString("fr")}</p>
      <p className="mt-0.5 text-xs">{label}</p>
    </div>
  );
}

function PreviewRow({ row }: { row: MappedArticleRow }) {
  const [expanded, setExpanded] = useState(false);
  const hasMessages = row.errors.length > 0 || row.warnings.length > 0;

  const icon = !row.isValid ? (
    <AlertCircle className="size-4 text-red-500" aria-label="Erreur" />
  ) : row.warnings.some((w) => w.includes("existe déjà")) ? (
    <RefreshCw className="size-4 text-blue-500" aria-label="Doublon" />
  ) : row.warnings.length > 0 ? (
    <AlertCircle className="size-4 text-amber-500" aria-label="Avertissement" />
  ) : (
    <CheckCircle2 className="size-4 text-green-500" aria-label="Valide" />
  );

  return (
    <>
      <tr
        className={[
          "transition-colors",
          !row.isValid
            ? "bg-red-50/40 dark:bg-red-950/10"
            : row.warnings.length > 0
              ? "bg-amber-50/30 dark:bg-amber-950/10"
              : "",
          hasMessages ? "hover:bg-muted/30 cursor-pointer" : "",
        ].join(" ")}
        onClick={() => hasMessages && setExpanded((v) => !v)}
      >
        <td className="px-3 py-2.5 text-center">{icon}</td>
        <td className="px-3 py-2.5">
          <code className="text-xs">{row.reference || "—"}</code>
        </td>
        <td className="max-w-xs px-3 py-2.5">
          <p className="truncate">{row.name || "—"}</p>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          {row.price !== null ? (
            formatPrice(row.price)
          ) : (
            <span className="text-red-500">—</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{row.stock}</td>
        <td className="px-3 py-2.5">
          <StatusBadge status={row.status} />
        </td>
      </tr>
      {expanded && hasMessages && (
        <tr>
          <td colSpan={6} className="px-3 pt-0 pb-3">
            <div className="space-y-1 pl-8">
              {row.errors.map((e, i) => (
                <p
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="size-3" />
                  {e}
                </p>
              ))}
              {row.warnings.map((w, i) => (
                <p
                  key={i}
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                >
                  <AlertCircle className="size-3 text-amber-500" />
                  {w}
                </p>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  OUT_OF_STOCK: "Rupture",
  COMING_SOON: "Bientôt",
  ARCHIVED: "Archivé",
  DISCONTINUED: "Arrêté",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
