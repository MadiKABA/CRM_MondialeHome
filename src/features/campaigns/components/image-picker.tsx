"use client";

import { useRef } from "react";
import { toast } from "sonner";
import {
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile } from "../lib/cloudinary-upload";
import type { FreeImage } from "@/features/templates/types";

interface Props {
  image: FreeImage;
  onChange: (image: FreeImage) => void;
  onRemove: () => void;
  onLayoutToggle: () => void;
}

export function ImagePicker({ image, onChange, onRemove, onLayoutToggle }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);

    onChange({
      ...image,
      cloudinaryId: null,
      url: URL.createObjectURL(file),
      file,
      alt: image.alt || file.name.replace(/\.[^/.]+$/, ""),
      width: 0,
      height: 0,
      isUploaded: false,
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
    onRemove();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onLayoutToggle}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
            image.layout === "full"
              ? "bg-gold-light/40 border-gold/30 text-gold-darker"
              : "bg-cream border-cream-darker text-text-muted hover:border-gold/40"
          )}
        >
          <LayoutTemplate className="size-3" />
          {image.layout === "full" ? "Pleine largeur" : "Demi-largeur"}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {!image.url ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "border-cream-darker hover:border-gold/50 hover:bg-cream/20 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-all"
          )}
        >
          <div className="bg-gold-light/30 flex size-9 items-center justify-center rounded-full">
            <ImageIcon className="text-gold-deep size-4.5" />
          </div>
          <div>
            <p className="text-text-primary text-xs font-medium">
              Cliquez ou glissez une image
            </p>
            <p className="text-text-muted text-[10px]">JPG, PNG, WEBP · max 5 MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border-cream-darker group relative overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt || "Aperçu"}
              className={cn(
                "w-full object-cover",
                image.layout === "full" ? "max-h-[180px]" : "max-h-[140px]"
              )}
            />

            {!image.isUploaded && (
              <div className="absolute top-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                En attente d&apos;upload
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-text-primary flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium"
              >
                <Upload className="size-3.5" />
                Changer
              </button>
            </div>
          </div>

          <div className="bg-cream/30 border-cream-darker space-y-2 rounded-lg border p-3">
            <div className="space-y-1">
              <label className="text-text-muted text-[10px]">
                Description * (accessibilité)
              </label>
              <input
                type="text"
                value={image.alt}
                onChange={(e) => onChange({ ...image, alt: e.target.value })}
                placeholder="Ex : Canapé Oslo - Collection Salon 2026"
                className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-muted text-[10px]">
                Légende (sous l&apos;image)
              </label>
              <input
                type="text"
                value={image.caption ?? ""}
                onChange={(e) => onChange({ ...image, caption: e.target.value || null })}
                placeholder="Ex : Canapé Oslo - 450 000 FCFA"
                className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-text-muted flex items-center gap-1 text-[10px]">
                <LinkIcon className="size-3" />
                Lien au clic (optionnel)
              </label>
              <input
                type="url"
                value={image.linkUrl ?? ""}
                onChange={(e) => onChange({ ...image, linkUrl: e.target.value || null })}
                placeholder="https://wa.me/221XXXXXXXXX"
                className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:outline-none"
              />
              {image.linkUrl && !image.linkUrl.startsWith("https://") && (
                <p className="text-[10px] text-red-500">
                  L&apos;URL doit commencer par https://
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
