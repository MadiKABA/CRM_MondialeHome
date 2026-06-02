"use client";

import { useState } from "react";
import { StepUpload } from "./step-upload";
import { StepMapping } from "./step-mapping";
import { StepPreview } from "./step-preview";
import { StepResult } from "./step-result";
import type { ParsedImportFile } from "../../lib/import-parser";
import type { MappedArticleRow } from "../../lib/import-mapper";
import type { ImportArticlesResult } from "../../server/import-actions";

type WizardStep = "upload" | "mapping" | "preview" | "result";

interface ImportWizardProps {
  existingReferences: string[];
}

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Fichier" },
  { key: "mapping", label: "Colonnes" },
  { key: "preview", label: "Vérification" },
  { key: "result", label: "Résultat" },
];

export function ImportWizard({ existingReferences }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [parsedFile, setParsedFile] = useState<ParsedImportFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappedRows, setMappedRows] = useState<MappedArticleRow[]>([]);
  const [result, setResult] = useState<ImportArticlesResult | null>(null);

  const existingRefSet = new Set(existingReferences);

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-8">
      {/* Indicateur d'étapes */}
      <nav aria-label="Étapes de l'import">
        <ol className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={[
                      "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary text-primary-foreground ring-primary ring-2 ring-offset-2"
                          : "bg-muted text-muted-foreground",
                    ].join(" ")}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isDone ? (
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={[
                      "hidden text-xs font-medium sm:block",
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "mx-2 h-0.5 flex-1 transition-colors",
                      i < currentIndex ? "bg-primary" : "bg-border",
                    ].join(" ")}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Contenu de l'étape active */}
      {step === "upload" && (
        <StepUpload
          onNext={(file, detectedMapping) => {
            setParsedFile(file);
            setMapping(detectedMapping);
            setStep("mapping");
          }}
        />
      )}

      {step === "mapping" && parsedFile && (
        <StepMapping
          parsedFile={parsedFile}
          initialMapping={mapping}
          existingReferences={existingRefSet}
          onBack={() => setStep("upload")}
          onNext={(finalMapping, rows) => {
            setMapping(finalMapping);
            setMappedRows(rows);
            setStep("preview");
          }}
        />
      )}

      {step === "preview" && (
        <StepPreview
          rows={mappedRows}
          onBack={() => setStep("mapping")}
          onResult={(res) => {
            setResult(res);
            setStep("result");
          }}
        />
      )}

      {step === "result" && result && (
        <StepResult
          result={result}
          onReset={() => {
            setParsedFile(null);
            setMapping({});
            setMappedRows([]);
            setResult(null);
            setStep("upload");
          }}
        />
      )}
    </div>
  );
}
