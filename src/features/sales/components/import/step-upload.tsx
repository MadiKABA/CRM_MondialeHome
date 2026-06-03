"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseImportFile,
  type ParsedImportFile,
} from "@/features/catalogue/articles/lib/import-parser";
import { autoDetectSaleMapping } from "../../lib/sales-import-mapper";
import {
  downloadSalesTemplateCSV,
  downloadSalesTemplateExcel,
} from "../../lib/sales-import-template";

const MAX_FILE_SIZE_MB = 10;
const MAX_ROWS = 2000;
const ACCEPTED_TYPES = [".csv", ".xls", ".xlsx"];

interface StepUploadProps {
  onNext: (file: ParsedImportFile, detectedMapping: Record<string, string>) => void;
}

export function StepUpload({ onNext }: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(
          `Le fichier dépasse la limite de ${MAX_FILE_SIZE_MB} Mo. Réduisez sa taille.`
        );
        return;
      }

      setSelectedFileName(file.name);
      setIsLoading(true);

      try {
        const parsed = await parseImportFile(file);

        if (parsed.totalRows === 0) {
          setError("Le fichier ne contient aucune ligne de données.");
          setIsLoading(false);
          return;
        }

        if (parsed.totalRows > MAX_ROWS) {
          setError(
            `Le fichier contient ${parsed.totalRows.toLocaleString("fr")} lignes. Maximum : ${MAX_ROWS.toLocaleString("fr")}.`
          );
          setIsLoading(false);
          return;
        }

        const detectedMapping = autoDetectSaleMapping(parsed.headers);
        onNext(parsed, detectedMapping);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de lire le fichier.");
      } finally {
        setIsLoading(false);
      }
    },
    [onNext]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sélectionner le fichier</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Étape 1 sur 4 — Importez l&apos;historique des ventes depuis un fichier CSV ou
          Excel
        </p>
      </div>

      {/* Zone de dépôt */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt de fichier"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          isLoading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="border-primary size-10 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-muted-foreground text-sm">Lecture du fichier en cours…</p>
          </div>
        ) : selectedFileName && !error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <FileSpreadsheet className="text-primary size-10" />
            <p className="font-medium">{selectedFileName}</p>
            <p className="text-muted-foreground text-xs">
              Cliquez pour changer de fichier
            </p>
          </div>
        ) : (
          <>
            <div className="bg-muted rounded-full p-4">
              <Upload className="text-muted-foreground size-8" />
            </div>
            <div className="text-center">
              <p className="font-medium">Glissez votre fichier ici</p>
              <p className="text-muted-foreground mt-1 text-sm">
                ou cliquez pour parcourir
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              CSV · XLS · XLSX · max {MAX_ROWS.toLocaleString("fr")} ventes ·{" "}
              {MAX_FILE_SIZE_MB} Mo
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <p className="mb-3 text-sm font-medium">Formats reconnus automatiquement :</p>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>
              • Une ligne par article vendu (plusieurs lignes = une vente multi-articles)
            </li>
            <li>• Les clients non existants sont créés automatiquement</li>
            <li>• Les ventes déjà importées sont ignorées (détection par référence)</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">Télécharger un fichier modèle :</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadSalesTemplateCSV();
            }}
            className="gap-2"
          >
            <FileText className="size-4" />
            Modèle CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadSalesTemplateExcel();
            }}
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            Modèle Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
