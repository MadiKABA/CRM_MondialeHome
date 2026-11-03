"use client";

// Upload Cloudinary différé : les fichiers restent en mémoire (blob URL de
// preview) tant que la campagne n'est pas soumise. L'upload réel vers
// Cloudinary passe par notre API route (/api/upload/campaign-image), qui
// signe la requête côté serveur — jamais d'upload anonyme depuis le navigateur.

import { postImage, uploadErrorMessage } from "@/lib/upload/client";
import type { BannerData, FreeImage } from "@/features/templates/types";

export { validateImageFile } from "@/lib/upload/client";

export const BANNER_KEY = "banner";

interface UploadApiResult {
  cloudinaryId: string;
  url: string;
  width: number;
  height: number;
}

export interface UploadFailure {
  // "banner" ou l'id de l'image libre
  key: string;
  label: string;
  message: string;
}

export interface UploadCampaignImagesResult {
  banner: BannerData;
  freeImages: FreeImage[];
  failures: UploadFailure[];
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

export function freeImageLabel(img: FreeImage): string {
  return `Image "${img.alt || img.file?.name || img.id}"`;
}

// Envoie la bannière si besoin ; lève une UploadError en cas d'échec
export async function uploadBanner(banner: BannerData): Promise<BannerData> {
  if (!banner.file || banner.isUploaded) return banner;
  const result = await uploadCampaignImage(banner.file, "campaigns/banners");
  if (banner.url?.startsWith("blob:")) URL.revokeObjectURL(banner.url);
  return { ...banner, url: result.url, file: null, isUploaded: true };
}

// Envoie une image libre si besoin ; lève une UploadError en cas d'échec
export async function uploadFreeImage(img: FreeImage): Promise<FreeImage> {
  if (!img.file || img.isUploaded) return img;
  const result = await uploadCampaignImage(img.file, "campaigns/free-images");
  if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
  return {
    ...img,
    cloudinaryId: result.cloudinaryId,
    url: result.url,
    width: result.width,
    height: result.height,
    file: null,
    isUploaded: true,
  };
}

// Appelé au clic "Créer la campagne" : n'envoie QUE les images restantes et
// renvoie l'état à jour (images réussies conservées) + la liste des échecs.
export async function uploadCampaignImages(
  banner: BannerData,
  freeImages: FreeImage[]
): Promise<UploadCampaignImagesResult> {
  const failures: UploadFailure[] = [];
  let uploadedBanner = banner;
  const uploadedImages: FreeImage[] = [];

  try {
    uploadedBanner = await uploadBanner(banner);
  } catch (err) {
    failures.push({
      key: BANNER_KEY,
      label: "Bannière",
      message: uploadErrorMessage(err),
    });
  }

  for (const img of freeImages) {
    try {
      uploadedImages.push(await uploadFreeImage(img));
    } catch (err) {
      failures.push({
        key: img.id,
        label: freeImageLabel(img),
        message: uploadErrorMessage(err),
      });
      uploadedImages.push(img);
    }
  }

  return { banner: uploadedBanner, freeImages: uploadedImages, failures };
}
