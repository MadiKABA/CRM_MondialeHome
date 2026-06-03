import "server-only";
import path from "path";
import { UPLOAD_CONFIG } from "./config";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  sizeBytes: number
): ValidationResult {
  if (sizeBytes > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024} Mo)`,
    };
  }

  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType as never)) {
    return { valid: false, error: `Type de fichier non autorisé : ${mimeType}` };
  }

  if (!checkMagicBytes(buffer)) {
    return { valid: false, error: "Le fichier n'est pas une image valide" };
  }

  const ext = path.extname(originalName).toLowerCase();
  if (ext && !UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext as never)) {
    return { valid: false, error: `Extension non autorisée : ${ext}` };
  }

  return { valid: true };
}

function checkMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return true;

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return true;

  return false;
}

export function buildSafePath(
  baseDir: string,
  relativeDir: string,
  filename?: string
): string {
  // Clean each path segment individually to prevent path traversal
  const cleanDir = relativeDir
    .split(/[/\\]/)
    .map((s) => s.replace(/\.\./g, "").replace(/[^a-zA-Z0-9\-_]/g, ""))
    .filter(Boolean)
    .join("/");

  const cleanFile = filename
    ? filename
        .replace(/\.\./g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "")
        .slice(0, 100)
    : "";

  const fullPath = cleanFile
    ? path.join(baseDir, cleanDir, cleanFile)
    : path.join(baseDir, cleanDir);

  const resolvedBase = path.resolve(baseDir);
  const resolvedFull = path.resolve(fullPath);

  if (
    resolvedFull !== resolvedBase &&
    !resolvedFull.startsWith(resolvedBase + path.sep)
  ) {
    throw new Error("Chemin invalide détecté (path traversal)");
  }

  return fullPath;
}
