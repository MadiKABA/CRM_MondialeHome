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
  folder: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `mondial-home/${folder}`,
        tags: ["campaign", "mondial-home"],
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
