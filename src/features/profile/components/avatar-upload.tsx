"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateAvatar, removeAvatar } from "../server/actions";

const MAX_FILE_SIZE = 2_000_000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
  currentImage: string | null;
  userName: string;
}

export function AvatarUpload({ currentImage }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fichier trop volumineux. Taille maximale : 2 Mo.");
      return;
    }

    const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];
    const uploadPreset = process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"];

    if (!cloudName || !uploadPreset) {
      toast.error("Configuration Cloudinary manquante.");
      console.error("Cloudinary env vars missing:", { cloudName, uploadPreset });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "mondial-home/avatars");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Cloudinary upload failed:", response.status, errorBody);
        throw new Error(`Upload échoué : ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const secureUrl = typeof data.secure_url === "string" ? data.secure_url : undefined;
      if (!secureUrl) throw new Error("URL manquante dans la réponse Cloudinary");

      const result = await updateAvatar({ imageUrl: secureUrl });
      if (result.success) {
        toast.success("Photo de profil mise à jour");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Échec de l'upload. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removeAvatar();
      if (result.success) {
        toast.success("Photo de profil supprimée");
        setConfirmRemoveOpen(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              disabled={isUploading}
              className="bg-gold-deep hover:bg-gold-darker absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Modifier la photo de profil"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
          }
        />

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="cursor-pointer"
          >
            <Upload className="size-4" />
            Téléverser une photo
          </DropdownMenuItem>

          {currentImage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmRemoveOpen(true);
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="size-4" />
                Supprimer la photo
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <div className="text-muted-foreground px-2 py-1 text-[11px]">
            JPG, PNG, WebP · max 2 Mo
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title="Supprimer la photo de profil ?"
        description="Votre avatar sera remplacé par vos initiales."
        confirmLabel={isRemoving ? "Suppression…" : "Supprimer"}
        onConfirm={handleRemove}
      />
    </>
  );
}
