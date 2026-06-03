"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Star, AlertTriangle, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  uploadArticleMainImage,
  uploadArticleSecondaryImage,
  deleteArticleMainImage,
  deleteArticleSecondaryImage,
  setArticleMainImage,
} from "../server/image-actions";

const MAX_FILES = 5; // max secondary images
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface UploadingItem {
  localId: string;
  previewUrl: string;
  filename: string;
}

interface ArticleImagesUploadProps {
  articleId: string;
  mainImage: string | null;
  images: string[];
  onMainImageChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function ArticleImagesUpload({
  articleId,
  mainImage,
  images,
  onMainImageChange,
  onImagesChange,
  disabled = false,
}: ArticleImagesUploadProps) {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState<UploadingItem[]>([]);
  const [deletingMain, setDeletingMain] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [confirmDeleteMain, setConfirmDeleteMain] = useState(false);
  const [confirmDeleteSecondary, setConfirmDeleteSecondary] = useState<string | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canAddMore = images.length + uploadingSecondary.length < MAX_FILES;

  // ── Main image ──────────────────────────────────────────────────────────────

  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (mainInputRef.current) mainInputRef.current.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG ou WebP)");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image trop volumineuse (max ${MAX_SIZE_MB} Mo)`);
      return;
    }

    setUploadingMain(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadArticleMainImage(articleId, formData);

      if (!result.success) {
        toast.error("Échec de l'upload", { description: result.error });
        return;
      }

      onMainImageChange(result.data!.url);
      toast.success("Image principale mise à jour");
    } finally {
      setUploadingMain(false);
    }
  };

  const handleDeleteMain = async () => {
    setDeletingMain(true);
    try {
      const result = await deleteArticleMainImage(articleId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onMainImageChange(null);
      toast.success("Image principale supprimée");
    } finally {
      setDeletingMain(false);
      setConfirmDeleteMain(false);
    }
  };

  // ── Secondary images ────────────────────────────────────────────────────────

  const handleSecondaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (secondaryInputRef.current) secondaryInputRef.current.value = "";
    if (!files.length) return;

    const available = MAX_FILES - images.length - uploadingSecondary.length;
    if (available <= 0) {
      toast.error(`Maximum ${MAX_FILES} images secondaires`);
      return;
    }

    const toProcess = files.slice(0, available);
    if (files.length > available) {
      toast.warning(`Seulement ${available} image(s) prise(s) en compte`);
    }

    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} : format non supporté`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} dépasse ${MAX_SIZE_MB} Mo`);
        return;
      }
    }

    for (const file of toProcess) {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      const item: UploadingItem = { localId, previewUrl, filename: file.name };

      setUploadingSecondary((prev) => [...prev, item]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadArticleSecondaryImage(articleId, formData);

        if (!result.success) {
          toast.error("Échec de l'upload", { description: result.error });
        } else {
          onImagesChange([...images, result.data!.url]);
          toast.success(`${file.name} uploadé`);
        }
      } catch {
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      } finally {
        URL.revokeObjectURL(previewUrl);
        setUploadingSecondary((prev) => prev.filter((i) => i.localId !== localId));
      }
    }
  };

  const handleDeleteSecondary = async (url: string) => {
    setDeletingUrl(url);
    try {
      const result = await deleteArticleSecondaryImage(articleId, url);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onImagesChange(images.filter((img) => img !== url));
      toast.success("Image supprimée");
    } finally {
      setDeletingUrl(null);
      setConfirmDeleteSecondary(null);
    }
  };

  const handleSetMain = async (url: string) => {
    try {
      const result = await setArticleMainImage(articleId, url);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      // Update local state to reflect the swap
      const newImages = images.filter((img) => img !== url);
      if (mainImage) newImages.unshift(mainImage);
      onMainImageChange(url);
      onImagesChange(newImages);
      toast.success("Image principale mise à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── IMAGE PRINCIPALE ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <input
          ref={mainInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleMainFileChange}
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            <Star className="mr-1.5 inline size-4 text-amber-500" />
            Image principale
          </p>
        </div>

        {mainImage ? (
          <div className="bg-muted group relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border-2 border-amber-400">
            <Image
              src={mainImage}
              alt="Image principale"
              fill
              className="object-contain"
              sizes="400px"
              unoptimized={mainImage.startsWith("/uploads/")}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setPreviewUrl(mainImage)}
                className="text-foreground rounded-lg bg-white/90 p-2 hover:bg-white"
                title="Prévisualiser"
              >
                <Eye className="size-4" />
              </button>
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => mainInputRef.current?.click()}
                    disabled={uploadingMain}
                    className="rounded-lg bg-amber-500 p-2 text-white hover:bg-amber-600 disabled:opacity-50"
                    title="Changer l'image"
                  >
                    {uploadingMain ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteMain(true)}
                    disabled={deletingMain}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-lg p-2 disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
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
            onClick={() => !disabled && mainInputRef.current?.click()}
            disabled={disabled || uploadingMain}
            className={cn(
              "aspect-video w-full max-w-sm rounded-xl",
              "border-border border-2 border-dashed",
              "flex flex-col items-center justify-center gap-2",
              "text-muted-foreground transition-all",
              !disabled && !uploadingMain
                ? "hover:border-primary/50 hover:bg-muted/30 hover:text-foreground cursor-pointer"
                : "cursor-not-allowed opacity-50"
            )}
          >
            {uploadingMain ? (
              <Loader2 className="size-8 animate-spin" />
            ) : (
              <ImagePlus className="size-8" />
            )}
            <p className="text-sm">
              {uploadingMain ? "Upload en cours…" : "Ajouter l&apos;image principale"}
            </p>
          </button>
        )}
      </div>

      {/* ── IMAGES SECONDAIRES ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <input
          ref={secondaryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={handleSecondaryFileChange}
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled}
        />

        <p className="text-sm font-medium">
          Images secondaires
          <span className="text-muted-foreground ml-2 font-normal">
            ({images.length + uploadingSecondary.length}/{MAX_FILES})
          </span>
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {/* Uploaded secondary images */}
          {images.map((url) => (
            <div
              key={url}
              className="group border-border bg-muted hover:border-primary/50 relative aspect-square overflow-hidden rounded-lg border transition-colors"
            >
              <Image
                src={url}
                alt="Image secondaire"
                fill
                className="object-cover"
                sizes="120px"
                unoptimized={url.startsWith("/uploads/")}
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
                  onClick={() => setConfirmDeleteSecondary(url)}
                  disabled={disabled || deletingUrl === url}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded p-1.5 disabled:opacity-50"
                  title="Supprimer"
                >
                  {deletingUrl === url ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploadingSecondary.map((item) => (
            <div
              key={item.localId}
              className="border-primary/50 bg-muted relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={item.previewUrl}
                alt="Upload en cours"
                fill
                className="object-cover opacity-50"
                sizes="120px"
                unoptimized
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                <Loader2 className="size-5 animate-spin text-white" />
                <span className="text-[10px] text-white">Upload…</span>
              </div>
            </div>
          ))}

          {/* Add button */}
          {canAddMore && !disabled && (
            <button
              type="button"
              onClick={() => secondaryInputRef.current?.click()}
              className={cn(
                "border-border aspect-square rounded-lg border-2 border-dashed",
                "flex flex-col items-center justify-center gap-1",
                "text-muted-foreground cursor-pointer transition-all",
                "hover:border-primary/50 hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <ImagePlus className="size-5" />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          JPG, PNG, WebP · max {MAX_SIZE_MB} Mo · {MAX_FILES} images secondaires maximum.
          Survolez une image secondaire pour la définir comme principale (⭐).
        </p>
      </div>

      {/* ── Prévisualisation ─────────────────────────────────────────────── */}
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
                unoptimized={previewUrl.startsWith("/uploads/")}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirmation suppression image principale ─────────────────────── */}
      <AlertDialog open={confirmDeleteMain} onOpenChange={setConfirmDeleteMain}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <AlertDialogTitle>Supprimer l&apos;image principale ?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              L&apos;image sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMain}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMain}
              disabled={deletingMain}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletingMain ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmation suppression image secondaire ─────────────────────── */}
      <AlertDialog
        open={!!confirmDeleteSecondary}
        onOpenChange={(open) => !open && setConfirmDeleteSecondary(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <AlertDialogTitle>Supprimer cette image ?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              L&apos;image sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingUrl}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDeleteSecondary && handleDeleteSecondary(confirmDeleteSecondary)
              }
              disabled={!!deletingUrl}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletingUrl ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog zoom prévisualisation ─────────────────────────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="size-5" />
          </button>
          <Image
            src={previewUrl}
            alt="Aperçu"
            width={1200}
            height={800}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            unoptimized={previewUrl.startsWith("/uploads/")}
          />
        </div>
      )}
    </div>
  );
}
