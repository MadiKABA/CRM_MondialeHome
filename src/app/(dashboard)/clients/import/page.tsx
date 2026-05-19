"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImportDropzone } from "@/features/clients/components/import/import-dropzone";
import { ImportMapping } from "@/features/clients/components/import/import-mapping";
import { ImportPreview } from "@/features/clients/components/import/import-preview";
import { ImportResultView } from "@/features/clients/components/import/import-result";
import {
  parseFile,
  autoMapColumns,
  mapAndValidateRows,
} from "@/features/clients/lib/import";
import { importClients } from "@/features/clients/server/actions";
import type { ImportPreviewRow, ImportResult } from "@/features/clients/types";
import type { ImportRow } from "@/features/clients/schemas/client.schema";

type Step = "upload" | "mapping" | "preview" | "result";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Fichier" },
  { key: "mapping", label: "Colonnes" },
  { key: "preview", label: "Vérification" },
  { key: "result", label: "Résultat" },
];

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const { headers: h, rows } = await parseFile(file);
      setHeaders(h);
      setRawRows(rows);
      setMapping(autoMapColumns(h));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de lecture du fichier");
    }
  };

  const goToMapping = () => {
    if (rawRows.length === 0) {
      toast.error("Veuillez d'abord sélectionner un fichier");
      return;
    }
    if (rawRows.length > 5000) {
      toast.error("Maximum 5 000 lignes par import");
      return;
    }
    setStep("mapping");
  };

  const goToPreview = () => {
    const mappedFields = Object.values(mapping);
    if (!mappedFields.includes("firstName")) {
      toast.error("La colonne Prénom est obligatoire");
      return;
    }
    const rows = mapAndValidateRows(rawRows, mapping);
    setPreviewRows(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    const validRows: ImportRow[] = previewRows
      .filter((r) => r.isValid)
      .map((r) => r.mapped as ImportRow);

    if (validRows.length === 0) {
      toast.error("Aucune ligne valide à importer");
      return;
    }

    setLoading(true);
    const result = await importClients(validRows);
    setLoading(false);

    if (result.success) {
      setImportResult(result.data ?? null);
      setStep("result");
    } else {
      toast.error(result.error);
    }
  };

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setPreviewRows([]);
    setImportResult(null);
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary"
          render={<Link href="/clients" />}
        >
          <ChevronLeft className="size-4" />
          Clients
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Importer des clients</h1>
        <p className="text-text-secondary mt-1 text-sm">
          {"Importez jusqu'à 5 000 clients depuis un fichier CSV ou Excel."}
        </p>
      </div>

      {/* Stepper */}
      {step !== "result" && (
        <div className="flex items-center gap-0">
          {STEPS.filter((s) => s.key !== "result").map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    i < stepIndex
                      ? "bg-gold-deep text-white"
                      : i === stepIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-cream-darker text-text-secondary"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    i === stepIndex
                      ? "text-foreground font-medium"
                      : "text-text-secondary"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className="bg-cream-darker mx-2 mb-5 h-px flex-1" />}
            </div>
          ))}
        </div>
      )}

      {/* Contenu étape */}
      <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
        {step === "upload" && (
          <div className="space-y-6">
            <ImportDropzone onFile={handleFile} />
            <div className="flex justify-end">
              <Button
                disabled={rawRows.length === 0}
                onClick={goToMapping}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Suivant →
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-6">
            <ImportMapping
              headers={headers}
              mapping={mapping}
              rowCount={rawRows.length}
              onMappingChange={setMapping}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                ← Précédent
              </Button>
              <Button
                onClick={goToPreview}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Prévisualiser →
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <ImportPreview rows={previewRows} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                ← Précédent
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || previewRows.filter((r) => r.isValid).length === 0}
                className="bg-gold-deep hover:bg-gold-darker min-w-[140px] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Import en cours…
                  </>
                ) : (
                  `Importer ${previewRows.filter((r) => r.isValid).length} clients →`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <ImportResultView result={importResult} onReset={reset} />
        )}
      </div>
    </div>
  );
}
