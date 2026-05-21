"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArticleImagesUploadProps {
  mainImage: string | null;
  images: string[];
  onMainImageChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CLOUDINARY_FOLDER = "mondial-home/articles";

export function ArticleImagesUpload({
  mainImage,
  images,
  onMainImageChange,
  onImagesChange,
  disabled = false,
}: ArticleImagesUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const allImages = [
    ...(mainImage ? [mainImage] : []),
    ...images.filter((img) => img !== mainImage),
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;

    const remaining = MAX_FILES - allImages.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} images par article`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Seulement ${remaining} image(s) uploadée(s) (limite ${MAX_FILES})`);
    }

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} : format non supporté (JPG, PNG, WebP uniquement)`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} dépasse ${MAX_SIZE_MB} Mo`);
        return;
      }
    }

    const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];
    const uploadPreset = process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"];

    if (!cloudName || !uploadPreset) {
      toast.error("Configuration Cloudinary manquante");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", CLOUDINARY_FOLDER);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Cloudinary error:", response.status, errorBody);
          toast.error(`Échec upload ${file.name}`);
          continue;
        }

        const data = (await response.json()) as Record<string, unknown>;
        const secureUrl =
          typeof data["secure_url"] === "string" ? data["secure_url"] : null;

        if (!secureUrl) {
          toast.error(`URL manquante pour ${file.name}`);
          continue;
        }

        uploadedUrls.push(secureUrl);
        setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
      }

      if (uploadedUrls.length > 0) {
        if (!mainImage) {
          onMainImageChange(uploadedUrls[0] ?? null);
          const rest = uploadedUrls.slice(1);
          if (rest.length > 0) onImagesChange([...images, ...rest]);
        } else {
          onImagesChange([...images, ...uploadedUrls]);
        }
        toast.success(
          uploadedUrls.length === 1
            ? "Image ajoutée avec succès"
            : `${uploadedUrls.length} images ajoutées`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSetMain = (url: string) => {
    const otherImages = images.filter((img) => img !== url);
    if (mainImage && mainImage !== url) {
      onImagesChange([mainImage, ...otherImages]);
    } else {
      onImagesChange(otherImages);
    }
    onMainImageChange(url);
  };

  const handleRemove = (url: string) => {
    if (url === mainImage) {
      const remaining = images.filter((img) => img !== url);
      onMainImageChange(remaining[0] ?? null);
      onImagesChange(remaining.slice(1));
    } else {
      onImagesChange(images.filter((img) => img !== url));
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
      />

      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {allImages.map((url, index) => {
            const isMain = url === mainImage;
            return (
              <div
                key={url}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2",
                  isMain ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />

                {isMain && (
                  <div className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                    Principale
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isMain && (
                    <button
                      type="button"
                      onClick={() => handleSetMain(url)}
                      className="bg-primary text-primary-foreground hover:bg-primary/80 rounded p-1.5 transition-colors"
                      title="Définir comme image principale"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded p-1.5 transition-colors"
                    title="Supprimer cette image"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {allImages.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              className={cn(
                "border-border aspect-square rounded-lg border-2 border-dashed",
                "flex flex-col items-center justify-center gap-1",
                "text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors",
                "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-[10px]">{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <ImagePlus className="size-5" />
                  <span className="text-[10px]">Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {allImages.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className={cn(
            "border-border w-full rounded-xl border-2 border-dashed",
            "flex flex-col items-center justify-center gap-2 py-10",
            "text-muted-foreground hover:border-primary/50 hover:bg-muted/30 hover:text-foreground transition-all",
            "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm">Upload en cours... {uploadProgress}%</p>
            </>
          ) : (
            <>
              <ImagePlus className="size-8" />
              <div className="text-center">
                <p className="text-sm font-medium">Cliquez pour ajouter des photos</p>
                <p className="mt-0.5 text-xs">
                  JPG, PNG, WebP · max {MAX_SIZE_MB} Mo · {MAX_FILES} images maximum
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {allImages.length > 0 && allImages.length < MAX_FILES && (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {allImages.length}/{MAX_FILES} images
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            Ajouter des photos
          </Button>
        </div>
      )}
    </div>
  );
}
