import "server-only";
import { cloudinary } from "./client";

export interface CloudinaryUploadResult {
  cloudinaryId: string;
  url: string;
  width: number;
  height: number;
}

// Upload signé côté serveur — la clé API et le secret ne quittent jamais le serveur.
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
  tags: string[] = ["mondial-home"]
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `mondial-home/${folder}`,
        tags,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          cloudinaryId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

// Supprime un asset Cloudinary — n'échoue pas si déjà absent ("not found").
export async function deleteImageByPublicId(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${result.result}`);
  }
}

// Un secure_url Cloudinary encode le public_id après /upload/v<version>/ :
// https://res.cloudinary.com/{cloud}/image/upload/v169.../mondial-home/articles/main/abc123.webp
// → mondial-home/articles/main/abc123
export function extractCloudinaryPublicId(url: string): string | null {
  const match = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/.exec(url);
  return match?.[1] ?? null;
}
