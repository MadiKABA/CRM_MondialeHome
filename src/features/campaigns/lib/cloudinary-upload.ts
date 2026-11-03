"use client";

// Upload Cloudinary différé : les fichiers restent en mémoire (blob URL de
// preview) tant que la campagne n'est pas soumise. L'upload réel vers
// Cloudinary passe par notre API route (/api/upload/campaign-image), qui
// signe la requête côté serveur — jamais d'upload anonyme depuis le navigateur.

import { postImage, uploadErrorMessage } from "@/lib/upload/client";
import type { BannerData, FreeImage } from "@/features/templates/types";

export { validateImageFile } from "@/lib/upload/client";

interface UploadApiResult {
  cloudinaryId: string;
  url: string;
  width: number;
  height: number;
}

async function uploadCampaignImage(
  file: File,
  folder: "campaigns/banners" | "campaigns/free-images"
): Promise<UploadApiResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return postImage<UploadApiResult>("/api/upload/campaign-image", formData);
}

export interface UploadCampaignImagesResult {
  banner: BannerData;
  freeImages: FreeImage[];
  errors: string[];
}

// Appelé UNIQUEMENT au moment du clic "Créer la campagne"
export async function uploadCampaignImages(
  banner: BannerData,
  freeImages: FreeImage[]
): Promise<UploadCampaignImagesResult> {
  const errors: string[] = [];
  let uploadedBanner: BannerData = banner;
  const uploadedImages: FreeImage[] = [];

  if (banner.file && !banner.isUploaded) {
    try {
      const result = await uploadCampaignImage(banner.file, "campaigns/banners");
      if (banner.url?.startsWith("blob:")) URL.revokeObjectURL(banner.url);
      uploadedBanner = {
        ...banner,
        url: result.url,
        file: null,
        isUploaded: true,
      };
    } catch (err) {
      errors.push(`Bannière : ${uploadErrorMessage(err)}`);
      uploadedBanner = banner;
    }
  }

  for (const img of freeImages) {
    if (img.file && !img.isUploaded) {
      try {
        const result = await uploadCampaignImage(img.file, "campaigns/free-images");
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
        uploadedImages.push({
          ...img,
          cloudinaryId: result.cloudinaryId,
          url: result.url,
          width: result.width,
          height: result.height,
          file: null,
          isUploaded: true,
        });
      } catch (err) {
        errors.push(`Image "${img.alt || img.id}" : ${uploadErrorMessage(err)}`);
        uploadedImages.push(img);
      }
    } else {
      uploadedImages.push(img);
    }
  }

  return { banner: uploadedBanner, freeImages: uploadedImages, errors };
}
