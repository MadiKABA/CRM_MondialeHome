"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ImagePlus,
  Loader2,
  Trash2,
  Star,
  X,
  AlertCircle,
  Upload,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const CLOUDINARY_FOLDER = "mondial-home/articles";

interface ImageItem {
  localId: string;
  localUrl: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  remoteUrl: string | null;
  errorMessage?: string;
}

interface ArticleImagesUploadProps {
  mainImage: string | null;
  images: string[];
  onMainImageChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

function checkCloudinaryConfig(): {
  ok: boolean;
  cloudName: string;
  uploadPreset: string;
  error?: string;
} {
  const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"] ?? "";
  const uploadPreset = process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ARTICLES"] ?? "";

  if (!cloudName) {
    return {
      ok: false,
      cloudName,
      uploadPreset,
      error: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME manquant dans .env.local",
    };
  }
  if (!uploadPreset) {
    return {
      ok: false,
      cloudName,
      uploadPreset,
      error: "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ARTICLES manquant dans .env.local",
    };
  }
  return { ok: true, cloudName, uploadPreset };
}

export function ArticleImagesUpload({
  mainImage,
  images,
  onMainImageChange,
  onImagesChange,
  disabled = false,
}: ArticleImagesUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<ImageItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const allRemoteUrls = [
    ...(mainImage ? [mainImage] : []),
    ...images.filter((img) => img !== mainImage),
  ];

  const config = checkCloudinaryConfig();

  const uploadFile = useCallback(async (item: ImageItem): Promise<string> => {
    const { cloudName, uploadPreset } = checkCloudinaryConfig();

    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", CLOUDINARY_FOLDER);

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          "Erreur réseau. Vérifiez : 1) votre connexion internet, " +
            "2) que NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME est correct dans .env.local, " +
            "3) que le preset « mondial_home_articles » existe sur Cloudinary en mode Unsigned."
        );
      }
      throw err;
    }

    if (!response.ok) {
      let errorMsg = `Erreur Cloudinary ${response.status}`;
      try {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        if (body.error?.message) {
          errorMsg = body.error.message;
          if (errorMsg.includes("Upload preset") || errorMsg.includes("unsigned")) {
            errorMsg =
              "Le preset Cloudinary n'est pas en mode Unsigned. " +
              "Allez dans Cloudinary › Settings › Upload Presets et passez-le en Unsigned.";
          }
        }
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const secureUrl = typeof data["secure_url"] === "string" ? data["secure_url"] : null;

    if (!secureUrl || !secureUrl.includes("res.cloudinary.com")) {
      throw new Error("URL Cloudinary invalide ou absente. Réessayez.");
    }

    return secureUrl;
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;

    if (!config.ok) {
      toast.error(config.error ?? "Configuration Cloudinary manquante", {
        duration: 8000,
        description: "Vérifiez votre fichier .env.local",
      });
      return;
    }

    const inFlight = uploadQueue.filter(
      (q) => q.status === "uploading" || q.status === "pending"
    ).length;
    const remaining = MAX_FILES - allRemoteUrls.length - inFlight;

    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} images par article`);
      return;
    }

    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Seulement ${remaining} image(s) prise(s) en compte`);
    }

    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} : format non supporté (JPG, PNG ou WebP)`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} dépasse ${MAX_SIZE_MB} Mo`);
        return;
      }
    }

    const newItems: ImageItem[] = toProcess.map((file) => ({
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      localUrl: URL.createObjectURL(file),
      file,
      status: "uploading" as const,
      remoteUrl: null,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      try {
        const remoteUrl = await uploadFile(item);

        setUploadQueue((prev) =>
          prev.map((q) =>
            q.localId === item.localId ? { ...q, status: "done", remoteUrl } : q
          )
        );

        if (!mainImage && allRemoteUrls.length === 0) {
          onMainImageChange(remoteUrl);
        } else {
          onImagesChange([...images, remoteUrl]);
        }
        toast.success(`${item.file.name} uploadé`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`Upload failed for ${item.file.name}:`, err);

        setUploadQueue((prev) =>
          prev.map((q) =>
            q.localId === item.localId
              ? { ...q, status: "error", errorMessage: errorMsg }
              : q
          )
        );

        toast.error(`Échec : ${item.file.name}`, {
          description: errorMsg,
          duration: 8000,
        });
      }
    }

    setTimeout(() => {
      setUploadQueue((prev) => {
        const errors = prev.filter((q) => q.status === "error");
        prev
          .filter((q) => q.status === "done")
          .forEach((q) => URL.revokeObjectURL(q.localUrl));
        return errors;
      });
    }, 3000);
  };

  const handleSetMain = (url: string) => {
    if (url === mainImage) return;
    const otherImages = [
      ...(mainImage ? [mainImage] : []),
      ...images.filter((img) => img !== url),
    ];
    onMainImageChange(url);
    onImagesChange(otherImages);
  };

  const handleRemoveRemote = (url: string) => {
    if (url === mainImage) {
      const remaining = images.filter((img) => img !== url);
      onMainImageChange(remaining[0] ?? null);
      onImagesChange(remaining.slice(1));
    } else {
      onImagesChange(images.filter((img) => img !== url));
    }
  };

  const handleRemoveFromQueue = (localId: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((q) => q.localId === localId);
      if (item) URL.revokeObjectURL(item.localUrl);
      return prev.filter((q) => q.localId !== localId);
    });
  };

  const handleRetry = async (item: ImageItem) => {
    setUploadQueue((prev) =>
      prev.map((q) =>
        q.localId === item.localId
          ? { ...q, status: "uploading", errorMessage: undefined }
          : q
      )
    );

    try {
      const remoteUrl = await uploadFile(item);
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.localId === item.localId ? { ...q, status: "done", remoteUrl } : q
        )
      );
      if (!mainImage) onMainImageChange(remoteUrl);
      else onImagesChange([...images, remoteUrl]);
      toast.success("Image uploadée avec succès");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.localId === item.localId ? { ...q, status: "error", errorMessage: msg } : q
        )
      );
      toast.error(`Toujours en échec : ${msg}`);
    }
  };

  const hasUploading = uploadQueue.some((q) => q.status === "uploading");
  const totalCount =
    allRemoteUrls.length +
    uploadQueue.filter((q) => q.status === "uploading" || q.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Alerte config manquante */}
      {!config.ok && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Configuration Cloudinary manquante</p>
            <p className="mt-0.5 text-xs text-red-600">{config.error}</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
      />

      {/* IMAGE PRINCIPALE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            <Star className="mr-1.5 inline size-4 text-amber-500" />
            Image principale
          </p>
          {!mainImage && (
            <span className="text-muted-foreground text-xs">
              La première image ajoutée devient l&apos;image principale
            </span>
          )}
        </div>

        {mainImage ? (
          <div className="bg-muted relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border-2 border-amber-400">
            <Image
              src={mainImage}
              alt="Image principale"
              fill
              className="object-contain"
              sizes="400px"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors hover:bg-black/40 hover:opacity-100">
              <button
                type="button"
                onClick={() => setPreviewUrl(mainImage)}
                className="text-foreground rounded-lg bg-white/90 p-2 transition-colors hover:bg-white"
                title="Prévisualiser"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveRemote(mainImage)}
                disabled={disabled}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-lg p-2 transition-colors disabled:opacity-50"
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="absolute top-2 left-2">
              <Badge className="gap-1 bg-amber-500 text-xs text-white">
                <Star className="size-3" />
                Principale
              </Badge>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => !disabled && config.ok && fileInputRef.current?.click()}
            disabled={disabled || !config.ok}
            className={cn(
              "aspect-video w-full max-w-sm rounded-xl",
              "border-border border-2 border-dashed",
              "flex flex-col items-center justify-center gap-2",
              "text-muted-foreground transition-all",
              !disabled &&
                config.ok &&
                "hover:border-primary/50 hover:bg-muted/30 hover:text-foreground cursor-pointer",
              (disabled || !config.ok) && "cursor-not-allowed opacity-50"
            )}
          >
            <ImagePlus className="size-8" />
            <p className="text-sm">Ajouter l&apos;image principale</p>
          </button>
        )}
      </div>

      {/* IMAGES SECONDAIRES */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Images supplémentaires
          <span className="text-muted-foreground ml-2 font-normal">
            (
            {allRemoteUrls.length +
              uploadQueue.filter((q) => q.status !== "error").length}
            /{MAX_FILES})
          </span>
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {/* Images déjà uploadées (secondaires) */}
          {images.map((url) => (
            <div
              key={url}
              className="group border-border bg-muted hover:border-primary/50 relative aspect-square overflow-hidden rounded-lg border transition-colors"
            >
              <Image
                src={url}
                alt="Image article"
                fill
                className="object-cover"
                sizes="120px"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-colors hover:bg-black/50 hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(url)}
                  className="text-foreground rounded bg-white/90 p-1.5 hover:bg-white"
                  title="Prévisualiser"
                >
                  <Eye className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMain(url)}
                  className="rounded bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                  title="Définir comme image principale"
                >
                  <Star className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveRemote(url)}
                  disabled={disabled}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded p-1.5 disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Images en cours d'upload */}
          {uploadQueue.map((item) => (
            <div
              key={item.localId}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border",
                item.status === "uploading" && "border-primary/50",
                item.status === "done" && "border-amber-500",
                item.status === "error" && "border-destructive"
              )}
            >
              <Image
                src={item.localUrl}
                alt="Upload en cours"
                fill
                className={cn(
                  "object-cover",
                  (item.status === "uploading" || item.status === "error") && "opacity-60"
                )}
                sizes="120px"
              />

              {item.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                  <Loader2 className="size-5 animate-spin text-white" />
                  <span className="text-[10px] text-white">Upload…</span>
                </div>
              )}

              {item.status === "done" && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20">
                  <div className="rounded-full bg-amber-500 p-1">
                    <Upload className="size-3 text-white" />
                  </div>
                </div>
              )}

              {item.status === "error" && (
                <div className="bg-destructive/60 absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                  <AlertCircle className="size-4 text-white" />
                  <span className="text-center text-[9px] leading-tight text-white">
                    {item.errorMessage?.slice(0, 40)}
                  </span>
                  <div className="mt-0.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleRetry(item)}
                      className="rounded bg-white/20 px-1 text-[9px] text-white hover:bg-white/30"
                    >
                      Réessayer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromQueue(item.localId)}
                      className="bg-destructive hover:bg-destructive/80 rounded px-1 text-[9px] text-white"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bouton ajouter */}
          {totalCount < MAX_FILES && (
            <button
              type="button"
              onClick={() => !disabled && config.ok && fileInputRef.current?.click()}
              disabled={disabled || !config.ok || hasUploading}
              className={cn(
                "border-border aspect-square rounded-lg border-2 border-dashed",
                "flex flex-col items-center justify-center gap-1",
                "text-muted-foreground transition-all",
                !disabled &&
                  config.ok &&
                  !hasUploading &&
                  "hover:border-primary/50 hover:bg-muted/30 hover:text-foreground cursor-pointer",
                (disabled || !config.ok || hasUploading) &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              {hasUploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              <span className="text-[10px]">{hasUploading ? "…" : "Ajouter"}</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        JPG, PNG, WebP · max {MAX_SIZE_MB} Mo par image · {MAX_FILES} images maximum.
        Survolez une image secondaire pour la définir comme principale (⭐).
      </p>

      {/* Dialog prévisualisation */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={previewUrl}
                alt="Prévisualisation"
                fill
                className="object-contain"
                sizes="800px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
