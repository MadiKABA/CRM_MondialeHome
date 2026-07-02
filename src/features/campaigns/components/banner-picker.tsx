"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { validateImageFile } from "../lib/cloudinary-upload";
import type { BannerData } from "@/features/templates/types";

interface Props {
  banner: BannerData;
  onChange: (banner: BannerData) => void;
}

export function BannerPicker({ banner, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    if (banner.url?.startsWith("blob:")) URL.revokeObjectURL(banner.url);

    onChange({
      url: URL.createObjectURL(file),
      file,
      linkUrl: banner.linkUrl,
      isUploaded: false,
    });

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    if (banner.url?.startsWith("blob:")) URL.revokeObjectURL(banner.url);
    onChange({ url: null, file: null, linkUrl: null, isUploaded: false });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-text-primary text-xs font-medium">
        Image bannière
        <span className="text-text-muted ml-1 font-normal">
          (optionnel — JPG, PNG, WEBP · max 5 MB · 600 × 200 px recommandé)
        </span>
      </label>

      {!banner.url ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="border-cream-darker hover:border-gold/50 hover:bg-cream/30 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all"
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="bg-gold-light/30 flex size-9 items-center justify-center rounded-full">
              <ImageIcon className="text-gold-deep size-4.5" />
            </div>
            <p className="text-text-primary text-xs font-medium">
              Cliquez pour choisir une bannière
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border-cream-darker group relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.url}
              alt="Bannière campagne"
              className="w-full object-cover"
              style={{ maxHeight: "160px" }}
            />

            {!banner.isUploaded && (
              <div className="absolute top-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                En attente d&apos;upload
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-text-primary hover:bg-cream flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <Upload className="size-3.5" />
                Changer
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                <X className="size-3.5" />
                Supprimer
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted flex items-center gap-1 text-[10px]">
              <LinkIcon className="size-3" />
              Lien de la bannière (optionnel)
            </label>
            <input
              type="url"
              value={banner.linkUrl ?? ""}
              onChange={(e) => onChange({ ...banner, linkUrl: e.target.value || null })}
              placeholder="https://mondialhomesn.com"
              className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-xs focus:outline-none"
            />
            {banner.linkUrl && !banner.linkUrl.startsWith("https://") && (
              <p className="text-[10px] text-red-500">
                L&apos;URL doit commencer par https://
              </p>
            )}
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
