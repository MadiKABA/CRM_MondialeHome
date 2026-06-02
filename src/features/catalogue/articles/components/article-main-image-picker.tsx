"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectedImageFile {
  file: File;
  previewUrl: string;
}

interface ArticleMainImagePickerProps {
  value: SelectedImageFile | string | null;
  onChange: (value: SelectedImageFile | null) => void;
  disabled?: boolean;
}

export function ArticleMainImagePicker({
  value,
  onChange,
  disabled = false,
}: ArticleMainImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(false);

  const previewUrl = typeof value === "string" ? value : (value?.previewUrl ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Format non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    // Créer l'aperçu local — aucun upload ici
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleRemove = () => {
    if (typeof value === "object" && value?.previewUrl) {
      URL.revokeObjectURL(value.previewUrl);
    }
    onChange(null);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="bg-muted group relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border-2 border-amber-400">
          <Image
            src={previewUrl}
            alt="Aperçu image principale"
            fill
            className="object-contain"
            sizes="400px"
            unoptimized={previewUrl.startsWith("blob:")}
          />

          {typeof value !== "string" && (
            <div className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
              Aperçu local
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="text-foreground rounded-lg bg-white/90 p-2 transition-colors hover:bg-white"
              title="Voir en grand"
            >
              <ZoomIn className="size-4" />
            </button>
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-lg bg-amber-500 p-2 text-white transition-colors hover:bg-amber-600"
                  title="Changer l'image"
                >
                  <ImagePlus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-lg p-2 transition-colors"
                  title="Supprimer"
                >
                  <X className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "aspect-video w-full max-w-sm rounded-xl",
            "border-border border-2 border-dashed",
            "flex flex-col items-center justify-center gap-2",
            "text-muted-foreground transition-all",
            !disabled &&
              "hover:border-primary/50 hover:bg-muted/30 hover:text-foreground cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <ImagePlus className="size-8" />
          <div className="text-center">
            <p className="text-sm font-medium">Sélectionner une image</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              JPG, PNG, WebP · max 5 Mo
            </p>
          </div>
        </button>
      )}

      {zoom && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl">
            <Image
              src={previewUrl}
              alt="Aperçu"
              width={1200}
              height={800}
              className="h-full w-full object-contain"
              unoptimized={previewUrl.startsWith("blob:")}
            />
            <button
              className="absolute top-3 right-3 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
              onClick={() => setZoom(false)}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
