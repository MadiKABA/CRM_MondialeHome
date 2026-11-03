"use client";

import { AlertTriangle, Loader2, RotateCw } from "lucide-react";
import type { UploadFailure } from "../../lib/cloudinary-upload";

interface Props {
  failures: UploadFailure[];
  retryingKey: string | null;
  disabled: boolean;
  onRetry: (key: string) => void;
}

// Liste des images non envoyées, avec un bouton pour réessayer chacune
export function UploadFailures({ failures, retryingKey, disabled, onRetry }: Props) {
  if (failures.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-red-700">
        <AlertTriangle className="size-4" />
        {failures.length} image{failures.length > 1 ? "s" : ""} non envoyée
        {failures.length > 1 ? "s" : ""} — la campagne n&apos;est pas encore créée
      </p>
      <p className="text-text-secondary text-xs">
        Les autres images sont conservées et ne seront pas renvoyées.
      </p>
      <ul className="space-y-2">
        {failures.map((f) => (
          <li
            key={f.key}
            className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-text-primary truncate text-sm font-medium">{f.label}</p>
              <p className="text-xs text-red-600">{f.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onRetry(f.key)}
              disabled={disabled || retryingKey !== null}
              className="border-cream-darker hover:bg-cream flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {retryingKey === f.key ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCw className="size-3.5" />
              )}
              Réessayer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
