"use client";

// Utilitaires d'envoi d'images côté navigateur (le serveur signe l'envoi Cloudinary).

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadErrorKind =
  | "invalid"
  | "format"
  | "too_large"
  | "rate_limit"
  | "auth"
  | "network"
  | "timeout"
  | "server";

export class UploadError extends Error {
  constructor(
    readonly kind: UploadErrorKind,
    message: string,
    readonly status: number | null = null,
    readonly retryAfterSec: number | null = null
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export const UPLOAD_MESSAGES = {
  format: "Format non supporté. Utilisez JPG, PNG ou WEBP.",
  heic: "Les photos HEIC ne sont pas supportées. Exportez-les en JPG ou PNG.",
  tooLarge: "Fichier trop lourd (5 Mo maximum).",
  network: "Connexion perdue. Vérifiez votre réseau puis réessayez.",
  timeout: "Le délai d'envoi est dépassé. Réessayez.",
  server: "Erreur du serveur. Réessayez dans un instant.",
  auth: "Session expirée. Reconnectez-vous puis réessayez.",
  forbidden: "Vous n'avez pas la permission d'envoyer des images.",
} as const;

// Type de fichier seul (le poids est vérifié après redimensionnement)
export function validateImageType(file: File): string | null {
  const name = file.name.toLowerCase();
  if (/image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/.test(name)) {
    return UPLOAD_MESSAGES.heic;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return UPLOAD_MESSAGES.format;
  }
  return null;
}

// Validation complète avant envoi : renvoie un message utilisateur, ou null si valide
export function validateImageFile(file: File): string | null {
  const typeError = validateImageType(file);
  if (typeError) return typeError;
  if (file.size > MAX_IMAGE_BYTES) return UPLOAD_MESSAGES.tooLarge;
  return null;
}

// Message lisible d'une erreur quelconque (jamais de détail technique)
export function uploadErrorMessage(err: unknown): string {
  return err instanceof UploadError ? err.message : UPLOAD_MESSAGES.server;
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// Convertit une réponse HTTP en erreur claire (corps lu en texte, JSON tenté ensuite)
function errorFromResponse(
  status: number,
  body: Record<string, unknown> | null,
  retryAfterHeader: string | null
): UploadError {
  const serverMessage = typeof body?.["error"] === "string" ? body["error"] : null;

  if (status === 413)
    return new UploadError("too_large", UPLOAD_MESSAGES.tooLarge, status);
  if (status === 401) return new UploadError("auth", UPLOAD_MESSAGES.auth, status);
  if (status === 403) return new UploadError("auth", UPLOAD_MESSAGES.forbidden, status);
  if (status === 429) {
    const secs = Number(retryAfterHeader);
    const retryAfterSec = Number.isFinite(secs) && secs > 0 ? Math.ceil(secs) : 60;
    return new UploadError(
      "rate_limit",
      `Trop d'envois. Réessayez dans ${retryAfterSec} s.`,
      status,
      retryAfterSec
    );
  }
  if (status >= 500) return new UploadError("server", UPLOAD_MESSAGES.server, status);
  // 4xx métier : le serveur renvoie un message français contrôlé
  return new UploadError("invalid", serverMessage ?? UPLOAD_MESSAGES.format, status);
}

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 2000];
// Au-delà, on n'attend pas automatiquement : l'utilisateur voit le délai
const MAX_AUTO_WAIT_SEC = 30;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Un seul envoi, avec délai d'attente de 30 s
async function postOnce<T>(url: string, formData: FormData): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch {
      throw timedOut
        ? new UploadError("timeout", UPLOAD_MESSAGES.timeout)
        : new UploadError("network", UPLOAD_MESSAGES.network);
    }

    // Corps lu en texte (le délai couvre aussi la lecture), JSON tenté ensuite
    let text = "";
    try {
      text = await res.text();
    } catch {
      throw timedOut
        ? new UploadError("timeout", UPLOAD_MESSAGES.timeout)
        : new UploadError("network", UPLOAD_MESSAGES.network);
    }
    const body = parseJson(text);

    if (!res.ok)
      throw errorFromResponse(res.status, body, res.headers.get("retry-after"));
    if (!body) throw new UploadError("server", UPLOAD_MESSAGES.server, res.status);
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

// POST multipart vers une route d'upload ; renvoie le JSON de succès.
// Réessaie 2 fois (attente 1 s puis 2 s) sur réseau, délai dépassé et 5xx.
// Jamais d'essai sur 400 (fichier invalide) ni 413. Sur 429, attend le délai
// indiqué par le serveur (si raisonnable) au lieu de réessayer tout de suite.
export async function postImage<T>(url: string, formData: FormData): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await postOnce<T>(url, formData);
    } catch (err) {
      if (!(err instanceof UploadError) || attempt >= MAX_RETRIES) throw err;

      if (err.kind === "rate_limit") {
        const wait = err.retryAfterSec ?? 60;
        if (wait > MAX_AUTO_WAIT_SEC) throw err;
        await sleep(wait * 1000);
        continue;
      }

      const retryable =
        err.kind === "network" || err.kind === "timeout" || err.kind === "server";
      if (!retryable) throw err;
      await sleep(BACKOFF_MS[attempt] ?? 2000);
    }
  }
}
