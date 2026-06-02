"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, RefreshCw, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ImportArticlesResult } from "../../server/import-actions";

interface StepResultProps {
  result: ImportArticlesResult;
  onReset: () => void;
}

export function StepResult({ result, onReset }: StepResultProps) {
  const hasErrors = result.errorDetails.length > 0;
  const isSuccess = result.created > 0 || result.updated > 0;

  const exportErrors = () => {
    const lines = [
      ["Ligne", "Référence", "Erreur / Avertissement"].join(";"),
      ...result.errorDetails.map((e) =>
        [e.row, e.reference, e.error.replace(/;/g, ",")].join(";")
      ),
    ];
    const bom = "﻿";
    const blob = new Blob([bom + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_articles_erreurs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier d'erreurs exporté");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* En-tête */}
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
              ? "Votre catalogue a été mis à jour avec succès."
              : "Aucun article n'a pu être importé."}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={result.created} label="créés" color="green" />
        <StatCard value={result.updated} label="mis à jour" color="blue" />
        <StatCard value={result.skipped} label="ignorés" color="neutral" />
        <StatCard
          value={result.errors}
          label="erreurs"
          color={result.errors > 0 ? "red" : "neutral"}
        />
      </div>

      {/* Détail des erreurs / avertissements */}
      {hasErrors && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="size-4 text-amber-500" />
              Détail des messages ({result.errorDetails.length})
            </h3>
            <Button variant="outline" size="sm" onClick={exportErrors} className="gap-2">
              Exporter les erreurs
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Ligne</th>
                  <th className="px-3 py-2 text-left font-medium">Réf.</th>
                  <th className="px-3 py-2 text-left font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.errorDetails.map((detail, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {detail.row}
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-xs">{detail.reference || "—"}</code>
                    </td>
                    <td className="px-3 py-2 text-sm">{detail.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isSuccess && (
          <Button className="gap-2" render={<Link href="/catalogue/articles" />}>
            <ListFilter className="size-4" />
            Voir les articles
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
  color: "green" | "blue" | "red" | "neutral";
}) {
  const styles = {
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-950/20 dark:text-green-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400",
    neutral: "border-border bg-muted/40 text-muted-foreground",
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[color]}`}>
      <p className="text-3xl font-bold">{value.toLocaleString("fr")}</p>
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}
