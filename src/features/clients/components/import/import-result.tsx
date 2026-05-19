"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "../../types";

interface ImportResultProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportResultView({ result, onReset }: ImportResultProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="bg-gold-light/40 rounded-full p-5">
        <CheckCircle2 className="text-gold-deep size-10" />
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold">Import terminé !</h2>
        <p className="text-text-secondary mt-1 text-sm">
          {"Voici le bilan de l'opération"}
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        <div className="border-cream-darker bg-gold-light/20 rounded-xl border p-4 text-center">
          <p className="font-heading text-gold-deep text-2xl font-bold">
            {result.created}
          </p>
          <p className="text-text-secondary mt-1 text-xs">créés</p>
        </div>
        {result.skipped > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
            <p className="font-heading text-2xl font-bold text-amber-600">
              {result.skipped}
            </p>
            <p className="text-text-secondary mt-1 text-xs">doublons ignorés</p>
          </div>
        )}
        {result.errors > 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
            <p className="font-heading text-2xl font-bold text-red-600">
              {result.errors}
            </p>
            <p className="text-text-secondary mt-1 text-xs">erreurs</p>
          </div>
        )}
      </div>

      {result.errorDetails.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="mb-2 text-left text-xs font-semibold">Détails des erreurs :</p>
          <div className="border-border max-h-32 overflow-y-auto rounded-lg border">
            {result.errorDetails.slice(0, 20).map(({ row, error }) => (
              <div
                key={row}
                className="border-border flex gap-2 border-b px-3 py-1.5 text-xs last:border-0"
              >
                <span className="text-text-secondary w-16 shrink-0">Ligne {row}</span>
                <span className="text-red-600">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="border-cream-darker hover:bg-cream"
        >
          Nouvel import
        </Button>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          render={<Link href="/clients" />}
        >
          Voir les clients
        </Button>
      </div>
    </div>
  );
}
