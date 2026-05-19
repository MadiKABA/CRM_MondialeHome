"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ImportPreviewRow } from "../../types";

interface ImportPreviewProps {
  rows: ImportPreviewRow[];
}

export function ImportPreview({ rows }: ImportPreviewProps) {
  const valid = rows.filter((r) => r.isValid).length;
  const duplicates = rows.filter((r) => r.isDuplicate).length;
  const errors = rows.filter((r) => r.errors.length > 0).length;

  const preview = rows.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="flex flex-wrap gap-3">
        <Badge className="bg-gold-light/50 text-gold-darker border-gold-light gap-1.5">
          <CheckCircle2 className="size-3.5" />
          {valid} valide{valid > 1 ? "s" : ""}
        </Badge>
        {duplicates > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700"
          >
            <AlertCircle className="size-3.5" />
            {duplicates} doublon{duplicates > 1 ? "s" : ""}
          </Badge>
        )}
        {errors > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 border-red-200 bg-red-50 text-red-700"
          >
            <XCircle className="size-3.5" />
            {errors} erreur{errors > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Tableau preview */}
      <div className="border-border overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream border-cream-darker border-b">
                <th className="px-3 py-2 text-left text-xs font-semibold">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Prénom</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Téléphone</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Ville</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {preview.map((row) => (
                <tr
                  key={row.rowIndex}
                  className={
                    row.errors.length > 0
                      ? "bg-red-50"
                      : row.isDuplicate
                        ? "bg-amber-50"
                        : "hover:bg-cream/50"
                  }
                >
                  <td className="text-text-secondary px-3 py-2">{row.rowIndex}</td>
                  <td className="px-3 py-2 font-medium">
                    {(row.mapped as Record<string, string>)?.firstName ?? (
                      <span className="text-destructive">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {(row.mapped as Record<string, string>)?.phone || "—"}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-xs">
                    {(row.mapped as Record<string, string>)?.email || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {(row.mapped as Record<string, string>)?.city || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.isDuplicate ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle className="size-3.5" /> Doublon
                      </span>
                    ) : row.errors.length > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="size-3.5" /> {row.errors[0]}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle2 className="size-3.5" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 10 && (
          <p className="text-text-secondary bg-cream border-cream-darker border-t px-4 py-2 text-xs">
            … et {rows.length - 10} lignes supplémentaires
          </p>
        )}
      </div>
    </div>
  );
}
