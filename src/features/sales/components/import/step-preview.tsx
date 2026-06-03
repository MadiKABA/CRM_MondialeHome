"use client";

import { useState, useTransition } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { MappedSaleGroup } from "../../lib/sales-import-mapper";
import { importSales, type ImportSalesResult } from "../../server/sales-import-actions";

function formatAmount(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA"
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

type FilterType = "all" | "valid" | "warnings" | "errors";

interface StepPreviewProps {
  groups: MappedSaleGroup[];
  onBack: () => void;
  onResult: (result: ImportSalesResult) => void;
}

export function StepPreview({ groups, onBack, onResult }: StepPreviewProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const PAGE_SIZE = 25;

  const valid = groups.filter((g) => g.isValid && g.warnings.length === 0);
  const withWarnings = groups.filter((g) => g.isValid && g.warnings.length > 0);
  const withErrors = groups.filter((g) => !g.isValid);
  const importableCount = groups.filter((g) => g.isValid).length;

  const newClientsCount = groups.filter(
    (g) => g.isValid && g.clientPhone && (g.clientFirstName || g.clientLastName)
  ).length;

  const filteredGroups =
    filter === "valid"
      ? valid
      : filter === "warnings"
        ? withWarnings
        : filter === "errors"
          ? withErrors
          : groups;

  const totalPages = Math.ceil(filteredGroups.length / PAGE_SIZE);
  const pagedGroups = filteredGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleImport = () => {
    startTransition(async () => {
      const result = await importSales(groups);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'import");
        return;
      }
      if (result.data) {
        toast.success(
          `Import terminé : ${result.data.created} vente${result.data.created > 1 ? "s" : ""} créée${result.data.created > 1 ? "s" : ""}`
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
          count={groups.filter((g) => g.isValid && g.warnings.length === 0).length}
          label="valides"
          color="green"
        />
        <SummaryCard count={withWarnings.length} label="avertissements" color="amber" />
        <SummaryCard
          count={withErrors.length}
          label="erreurs"
          color={withErrors.length > 0 ? "red" : "neutral"}
        />
        <SummaryCard count={groups.length} label="ventes total" color="neutral" />
      </div>

      {newClientsCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-300">
          <Users className="size-4 shrink-0" />
          <span>
            <strong>{newClientsCount}</strong> nouveau{newClientsCount > 1 ? "x" : ""}{" "}
            client{newClientsCount > 1 ? "s" : ""} seront créés lors de l&apos;import
          </span>
        </div>
      )}

      {/* Filtres et pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as FilterType);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les ventes ({groups.length})</SelectItem>
            <SelectItem value="valid">Valides ({valid.length})</SelectItem>
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
              {Math.min(page * PAGE_SIZE, filteredGroups.length)} sur{" "}
              {filteredGroups.length}
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="w-8 px-3 py-3 text-center font-medium" />
                <th className="px-3 py-3 text-left font-medium">Réf. vente</th>
                <th className="px-3 py-3 text-left font-medium">Date</th>
                <th className="px-3 py-3 text-left font-medium">Client</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-left font-medium">Articles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedGroups.map((group) => (
                <PreviewRow key={group.saleReference} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredGroups.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucune vente pour ce filtre.
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
              Importer {importableCount.toLocaleString("fr")} vente
              {importableCount > 1 ? "s" : ""} valide{importableCount > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PreviewRow({ group }: { group: MappedSaleGroup }) {
  const [expanded, setExpanded] = useState(false);
  const hasMessages = group.errors.length > 0 || group.warnings.length > 0;

  const subtotal = group.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const discount = group.discountPercent ? (subtotal * group.discountPercent) / 100 : 0;
  const total = Math.max(0, subtotal - discount);

  const clientName = [group.clientFirstName, group.clientLastName]
    .filter(Boolean)
    .join(" ");

  const icon = !group.isValid ? (
    <AlertCircle className="size-4 text-red-500" aria-label="Erreur" />
  ) : group.warnings.length > 0 ? (
    <AlertCircle className="size-4 text-amber-500" aria-label="Avertissement" />
  ) : (
    <CheckCircle2 className="size-4 text-green-500" aria-label="Valide" />
  );

  return (
    <>
      <tr
        className={[
          "transition-colors",
          !group.isValid
            ? "bg-red-50/40 dark:bg-red-950/10"
            : group.warnings.length > 0
              ? "bg-amber-50/30 dark:bg-amber-950/10"
              : "",
          hasMessages ? "hover:bg-muted/30 cursor-pointer" : "",
        ].join(" ")}
        onClick={() => hasMessages && setExpanded((v) => !v)}
      >
        <td className="px-3 py-2.5 text-center">{icon}</td>
        <td className="px-3 py-2.5">
          <code className="text-xs">{group.saleReference}</code>
        </td>
        <td className="text-muted-foreground px-3 py-2.5 text-xs whitespace-nowrap">
          {formatDate(group.date)}
        </td>
        <td className="max-w-[140px] truncate px-3 py-2.5">
          {clientName || <span className="text-muted-foreground">—</span>}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(total)}</td>
        <td className="text-muted-foreground px-3 py-2.5 text-xs">
          {group.items.length} article{group.items.length > 1 ? "s" : ""}
        </td>
      </tr>
      {expanded && hasMessages && (
        <tr>
          <td colSpan={6} className="px-3 pt-0 pb-3">
            <div className="space-y-1 pl-8">
              {group.errors.map((e, i) => (
                <p
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="size-3" />
                  {e}
                </p>
              ))}
              {group.warnings.map((w, i) => (
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

function SummaryCard({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: "green" | "blue" | "amber" | "red" | "neutral";
}) {
  const styles: Record<string, string> = {
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-950/20 dark:text-green-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-400",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400",
    neutral: "border-border bg-muted/40 text-muted-foreground",
  };

  return (
    <div className={`rounded-lg border p-3 ${styles[color]}`}>
      <p className="text-2xl font-bold">{count.toLocaleString("fr")}</p>
      <p className="mt-0.5 text-xs">{label}</p>
    </div>
  );
}
