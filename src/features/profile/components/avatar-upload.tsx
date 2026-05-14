"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Camera, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateAvatar, removeAvatar } from "../server/actions";

interface AvatarUploadProps {
  currentImage: string | null;
  userName: string;
}

export function AvatarUpload({ currentImage }: AvatarUploadProps) {
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleUploadSuccess = async (results: CloudinaryUploadWidgetResults) => {
    if (results.event !== "success" || typeof results.info !== "object" || !results.info)
      return;

    const info = results.info as { secure_url?: string };
    if (!info.secure_url) return;

    const result = await updateAvatar({ imageUrl: info.secure_url });
    if (result.success) {
      toast.success("Photo de profil mise à jour");
    } else {
      toast.error(result.error);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removeAvatar();
      if (result.success) {
        toast.success("Photo de profil supprimée");
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full shadow-md transition-colors"
              aria-label="Modifier la photo de profil"
            />
          }
        >
          <Camera className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <CldUploadWidget
            uploadPreset={
              process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"] ?? "ml_default"
            }
            options={{
              folder: "mondial-home/avatars",
              cropping: true,
              croppingAspectRatio: 1,
              maxImageWidth: 400,
              maxImageHeight: 400,
              clientAllowedFormats: ["jpg", "png", "webp"],
              maxFileSize: 2_000_000,
              multiple: false,
              sources: ["local", "camera"],
            }}
            onSuccess={handleUploadSuccess}
          >
            {({ open }) => (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  open();
                }}
              >
                <Camera className="size-4" />
                Téléverser une photo
              </DropdownMenuItem>
            )}
          </CldUploadWidget>

          {currentImage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmRemoveOpen(true);
                }}
                className="text-destructive focus:text-destructive"
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
