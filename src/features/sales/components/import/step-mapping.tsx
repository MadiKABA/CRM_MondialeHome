"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ParsedImportFile } from "@/features/catalogue/articles/lib/import-parser";
import {
  SALE_FIELD_ALIASES,
  mapAndGroupSaleRows,
  type MappedSaleGroup,
} from "../../lib/sales-import-mapper";

const FIELD_LABELS: Record<string, string> = {
  saleReference: "Référence vente *",
  date: "Date de vente *",
  clientLastName: "Nom du client",
  clientFirstName: "Prénom du client",
  clientPhone: "Téléphone client",
  clientName: "Nom complet client",
  articleRef: "Référence article",
  articleName: "Nom de l'article *",
  quantity: "Quantité",
  unitPrice: "Prix unitaire *",
  lineDiscount: "Remise ligne (FCFA)",
  globalDiscount: "Remise globale (%)",
  paymentMethod: "Mode de paiement",
  paidAmount: "Montant payé (FCFA)",
  status: "Statut",
  notes: "Notes",
  seller: "Vendeur",
  campaign: "Campagne",
};

const IGNORE_VALUE = "__ignore__";

interface StepMappingProps {
  parsedFile: ParsedImportFile;
  initialMapping: Record<string, string>;
  onBack: () => void;
  onNext: (mapping: Record<string, string>, groups: MappedSaleGroup[]) => void;
}

export function StepMapping({
  parsedFile,
  initialMapping,
  onBack,
  onNext,
}: StepMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => initialMapping);

  const availableFields = Object.keys(SALE_FIELD_ALIASES);
  const mappedCount = Object.values(mapping).filter(
    (v) => v && v !== IGNORE_VALUE
  ).length;
  const autoMappedCount = Object.values(initialMapping).filter(
    (v) => v && v !== IGNORE_VALUE
  ).length;
  const unmappedCount = parsedFile.headers.filter(
    (h) => !mapping[h] || mapping[h] === IGNORE_VALUE
  ).length;

  const exampleRows = parsedFile.rows.slice(0, 3);

  const hasRequiredFields =
    Object.values(mapping).includes("articleName") &&
    Object.values(mapping).includes("unitPrice");

  const handleNext = () => {
    const groups = mapAndGroupSaleRows(parsedFile.rows, mapping);
    onNext(mapping, groups);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Correspondance des colonnes</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Étape 2 sur 4 —{" "}
          <span className="text-foreground font-medium">
            {parsedFile.totalRows.toLocaleString("fr")} lignes
          </span>{" "}
          détectées dans &quot;{parsedFile.fileName}&quot;
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-4 text-green-600" />
          <span>
            <span className="font-medium">{mappedCount}</span> colonne
            {mappedCount > 1 ? "s" : ""} mappée{mappedCount > 1 ? "s" : ""}
          </span>
          {autoMappedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {autoMappedCount} auto
            </Badge>
          )}
        </div>
        {unmappedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="size-4 text-amber-500" />
            <span>
              <span className="font-medium">{unmappedCount}</span> colonne
              {unmappedCount > 1 ? "s" : ""} ignorée{unmappedCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">
                  Colonne dans votre fichier
                </th>
                <th className="px-4 py-3 text-left font-medium">Champ CRM</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  Exemples (3 premières lignes)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {parsedFile.headers.map((header) => {
                const currentValue = mapping[header] ?? IGNORE_VALUE;
                const isAutoMapped =
                  initialMapping[header] && initialMapping[header] !== IGNORE_VALUE;
                const isMapped = currentValue && currentValue !== IGNORE_VALUE;

                return (
                  <tr
                    key={header}
                    className={[
                      "transition-colors",
                      isMapped ? "" : "bg-amber-50/30 dark:bg-amber-950/10",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                          {header}
                        </code>
                        {isAutoMapped && isMapped && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            auto
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={currentValue}
                        onValueChange={(val) =>
                          setMapping((prev) => ({
                            ...prev,
                            [header]: val ?? IGNORE_VALUE,
                          }))
                        }
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder="Ignorer cette colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IGNORE_VALUE}>
                            <span className="text-muted-foreground">
                              Ignorer cette colonne
                            </span>
                          </SelectItem>
                          {availableFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {FIELD_LABELS[field] ?? field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="space-y-0.5">
                        {exampleRows.map((row, i) => {
                          const val = row[header];
                          return val ? (
                            <p
                              key={i}
                              className="text-muted-foreground truncate text-xs"
                              title={val}
                            >
                              {val}
                            </p>
                          ) : null;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!hasRequiredFields && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Les champs <strong>nom de l&apos;article</strong> et{" "}
            <strong>prix unitaire</strong> sont obligatoires pour continuer.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <Button onClick={handleNext} disabled={!hasRequiredFields} className="gap-2">
          Prévisualiser
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
