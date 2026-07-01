"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

interface BannerUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function BannerUpload({ value, onChange }: BannerUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non accepté. Utilisez JPG, PNG, WEBP ou GIF");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop lourde. Maximum 5 MB");
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/banner", { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error ?? "Erreur upload");
      }

      onChange(body.url);
      setPreview(body.url);
      toast.success("Image uploadée avec succès");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload");
      setPreview(value || null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(blobUrl);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <label className="text-text-primary text-xs font-medium">
        Image bannière
        <span className="text-text-muted ml-1 font-normal">
          (optionnel — JPG, PNG, WEBP · max 5 MB)
        </span>
      </label>

      {!preview ? (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className="border-cream-darker hover:border-gold/50 hover:bg-cream/30 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="text-gold-deep size-6 animate-spin" />
              <p className="text-text-muted text-xs">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-gold-light/30 flex size-9 items-center justify-center rounded-full">
                <ImageIcon className="text-gold-deep size-4.5" />
              </div>
              <p className="text-text-primary text-xs font-medium">
                Cliquez pour choisir une image
              </p>
              <p className="text-text-muted text-[10px]">
                Format recommandé : 600 × 200 px
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-cream-darker group relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Bannière campagne"
            className="w-full object-cover"
            style={{ maxHeight: "160px" }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="text-text-primary hover:bg-cream flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <Upload className="size-3.5" />
              Changer
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
            >
              <X className="size-3.5" />
              Supprimer
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="text-gold-deep size-5 animate-spin" />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
