"use client";

// Redimensionnement d'images dans le navigateur (canevas natif, sans dépendance).
// - largeur max 1600 px, proportions conservées, jamais d'agrandissement
// - image déjà petite et bien orientée : renvoyée telle quelle (pas de recompression)
// - orientation EXIF corrigée (photos de smartphone)
// - sortie JPEG 0,85 ; WEBP/PNG avec transparence : WEBP (ou PNG si non supporté)
// - en cas d'échec : le fichier d'origine est conservé

import { MAX_IMAGE_BYTES, UPLOAD_MESSAGES, validateImageType } from "@/lib/upload/client";

const MAX_WIDTH = 1600;
const QUALITY = 0.85;
// Plafond d'entrée : au-delà, on refuse avant même d'essayer de décoder
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

// Lit l'orientation EXIF (1 = normale) dans les premiers octets d'un JPEG
async function readJpegOrientation(file: File): Promise<number> {
  if (file.type !== "image/jpeg") return 1;
  try {
    const view = new DataView(await file.slice(0, 65536).arrayBuffer());
    if (view.getUint16(0) !== 0xffd8) return 1;
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      const size = view.getUint16(offset + 2);
      if (marker === 0xffe1) {
        if (view.getUint32(offset + 4) !== 0x45786966) return 1; // "Exif"
        const tiff = offset + 10;
        const little = view.getUint16(tiff) === 0x4949;
        const ifd = tiff + view.getUint32(tiff + 4, little);
        const entries = view.getUint16(ifd, little);
        for (let i = 0; i < entries; i++) {
          const entry = ifd + 2 + i * 12;
          if (view.getUint16(entry, little) === 0x0112) {
            return view.getUint16(entry + 8, little);
          }
        }
        return 1;
      }
      if ((marker & 0xff00) !== 0xff00) return 1;
      offset += 2 + size;
    }
  } catch {
    // métadonnées illisibles : on considère l'image comme normale
  }
  return 1;
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 255) return true;
  }
  return false;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function renamed(name: string, type: string): string {
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `${name.replace(/\.[^.]+$/, "")}.${ext}`;
}

async function resizeFile(file: File): Promise<File> {
  const orientation = await readJpegOrientation(file);
  // "from-image" applique l'orientation EXIF au décodage
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const needsResize = bitmap.width > MAX_WIDTH;
    if (!needsResize && orientation <= 1) return file;

    const scale = needsResize ? MAX_WIDTH / bitmap.width : 1;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mayHaveAlpha = file.type !== "image/jpeg";
    const alpha = mayHaveAlpha && hasTransparency(ctx, width, height);

    let blob: Blob | null;
    if (alpha) {
      blob = await toBlob(canvas, "image/webp", QUALITY);
      if (blob?.type !== "image/webp") blob = await toBlob(canvas, "image/png");
    } else {
      blob = await toBlob(canvas, "image/jpeg", QUALITY);
    }
    if (!blob) return file;

    // Pas de gain et orientation correcte : on garde l'original
    if (orientation <= 1 && blob.size >= file.size) return file;

    return new File([blob], renamed(file.name, blob.type), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export type PreparedImage = { file: File } | { error: string };

// Valide le type, redimensionne, puis vérifie le poids final (5 Mo)
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  const typeError = validateImageType(file);
  if (typeError) return { error: typeError };
  if (file.size > MAX_INPUT_BYTES) return { error: UPLOAD_MESSAGES.tooLarge };

  let result = file;
  try {
    result = await resizeFile(file);
  } catch {
    result = file; // échec du redimensionnement : fichier d'origine
  }

  if (result.size > MAX_IMAGE_BYTES) return { error: UPLOAD_MESSAGES.tooLarge };
  return { file: result };
}
