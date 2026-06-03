import "server-only";
import sharp from "sharp";

interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export interface CompressResult {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
  originalSize: number;
  savings: string;
}

export async function compressImage(
  inputBuffer: Buffer,
  options: CompressOptions
): Promise<CompressResult> {
  const originalSize = inputBuffer.length;

  const { data, info } = await sharp(inputBuffer)
    .rotate() // respect EXIF orientation
    .resize(options.maxWidth, options.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: options.quality, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const savings =
    originalSize > 0
      ? `${Math.round((1 - data.length / originalSize) * 100)}% de réduction`
      : "0%";

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    sizeBytes: data.length,
    originalSize,
    savings,
  };
}

export function compressAvatar(buffer: Buffer): Promise<CompressResult> {
  return compressImage(buffer, { maxWidth: 400, maxHeight: 400, quality: 85 });
}

export function compressArticleImage(buffer: Buffer): Promise<CompressResult> {
  return compressImage(buffer, { maxWidth: 1200, maxHeight: 1200, quality: 82 });
}
