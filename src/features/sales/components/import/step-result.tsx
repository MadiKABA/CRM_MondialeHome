"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, RefreshCw, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ImportSalesResult } from "../../server/sales-import-actions";

function formatAmount(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA"
  );
}

interface StepResultProps {
  result: ImportSalesResult;
  onReset: () => void;
}

export function StepResult({ result, onReset }: StepResultProps) {
  const hasErrors = result.errorDetails.length > 0;
  const isSuccess = result.created > 0;

  const exportErrors = () => {
    const lines = [
      ["Référence vente", "Erreur"].join(";"),
      ...result.errorDetails.map((e) =>
        [e.saleRef, e.error.replace(/;/g, ",")].join(";")
      ),
    ];
    const bom = "﻿";
    const blob = new Blob([bom + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_ventes_erreurs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier d'erreurs exporté");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600" />
        ) : (
          <AlertCircle className="mt-0.5 size-6 shrink-0 text-red-500" />
        )}
        <div>
          <h2 className="text-lg font-semibold">
            {isSuccess ? "Import terminé !" : "Import échoué"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {isSuccess
              ? "L'historique des ventes a été importé avec succès."
              : "Aucune vente n'a pu être importée."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard value={result.created} label="ventes créées" color="green" />
        <StatCard value={result.clientsCreated} label="clients créés" color="blue" />
        <StatCard
          value={result.errors + result.skipped}
          label="ignorées"
          color="neutral"
        />
      </div>

      {isSuccess && result.totalRevenue > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/50 dark:bg-green-950/20">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            CA importé
          </p>
          <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-300">
            {formatAmount(result.totalRevenue)}
          </p>
        </div>
      )}

      {hasErrors && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="size-4 text-amber-500" />
              Détail des erreurs ({result.errorDetails.length})
            </h3>
            <Button variant="outline" size="sm" onClick={exportErrors} className="gap-2">
              Télécharger le rapport
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Réf. vente</th>
                  <th className="px-3 py-2 text-left font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.errorDetails.map((detail, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <code className="text-xs">{detail.saleRef}</code>
                    </td>
                    <td className="px-3 py-2 text-sm">{detail.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isSuccess && (
          <Button className="gap-2" render={<Link href="/sales" />}>
            <ListFilter className="size-4" />
            Voir les ventes
          </Button>
        )}
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RefreshCw className="size-4" />
          Nouvel import
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "green" | "blue" | "neutral";
}) {
  const styles: Record<string, string> = {
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-950/20 dark:text-green-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400",
    neutral: "border-border bg-muted/40 text-muted-foreground",
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[color]}`}>
      <p className="text-3xl font-bold">{value.toLocaleString("fr")}</p>
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}
