"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { validateUploadedFile } from "@/lib/upload/sanitize";
import { UPLOAD_CONFIG } from "@/lib/upload/config";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  uploadImageBuffer,
  deleteImageByPublicId,
  extractCloudinaryPublicId,
} from "@/lib/cloudinary/upload";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

const MAX_SECONDARY = UPLOAD_CONFIG.ARTICLE_SECONDARY.MAX_COUNT;
const ARTICLE_TAGS = ["article", "mondial-home"];

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function revalidateArticle(articleId: string) {
  revalidatePath("/catalogue/articles");
  revalidatePath(`/catalogue/articles/${articleId}`);
}

function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

// Best-effort : ne bloque jamais le flux principal si la suppression Cloudinary échoue.
async function tryDeleteCloudinaryImage(url: string): Promise<void> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  try {
    await deleteImageByPublicId(publicId);
  } catch (error) {
    logger.warn({ error, publicId }, "Failed to delete Cloudinary asset");
  }
}

// ── Upload image principale ───────────────────────────────────────────────────

export async function uploadArticleMainImage(
  articleId: string,
  formData: FormData
): Promise<Result<{ url: string }>> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const article = await db.article.findUnique({
      where: { id: articleId, deletedAt: null },
      select: { id: true, mainImage: true },
    });
    if (!article) return { success: false, error: "Article introuvable" };

    const rateCheck = await checkRateLimit({
      key: `upload_article_img:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return { success: false, error: "Trop d'uploads. Attendez une minute." };
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, error: "Aucun fichier reçu" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validateUploadedFile(buffer, file.name, file.type, buffer.length);
    if (!validation.valid) return { success: false, error: validation.error! };

    const uploaded = await uploadImageBuffer(buffer, "articles/main", ARTICLE_TAGS);

    await db.article.update({
      where: { id: articleId },
      data: { mainImage: uploaded.url },
    });

    if (article.mainImage) {
      await tryDeleteCloudinaryImage(article.mainImage);
    }

    revalidateArticle(articleId);
    return { success: true, data: { url: uploaded.url } };
  } catch (error) {
    logger.error({ error }, "Failed to upload article main image");
    return { success: false, error: "Erreur lors de l'upload" };
  }
}

// ── Supprimer image principale ────────────────────────────────────────────────

export async function deleteArticleMainImage(articleId: string): Promise<Result> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const article = await db.article.findUnique({
      where: { id: articleId, deletedAt: null },
      select: { id: true, mainImage: true },
    });
    if (!article) return { success: false, error: "Article introuvable" };
    if (!article.mainImage) return { success: false, error: "Aucune image principale" };

    await tryDeleteCloudinaryImage(article.mainImage);

    await db.article.update({
      where: { id: articleId },
      data: { mainImage: null },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "article.image.main.delete",
        entity: "Article",
        entityId: articleId,
        status: "success",
      },
    });

    revalidateArticle(articleId);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete article main image");
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ── Upload image secondaire ───────────────────────────────────────────────────

export async function uploadArticleSecondaryImage(
  articleId: string,
  formData: FormData
): Promise<Result<{ url: string }>> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const article = await db.article.findUnique({
      where: { id: articleId, deletedAt: null },
      select: { id: true, images: true },
    });
    if (!article) return { success: false, error: "Article introuvable" };

    if (article.images.length >= MAX_SECONDARY) {
      return {
        success: false,
        error: `Maximum ${MAX_SECONDARY} images secondaires par article`,
      };
    }

    const rateCheck = await checkRateLimit({
      key: `upload_article_img:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return { success: false, error: "Trop d'uploads. Attendez une minute." };
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, error: "Aucun fichier reçu" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validateUploadedFile(buffer, file.name, file.type, buffer.length);
    if (!validation.valid) return { success: false, error: validation.error! };

    const uploaded = await uploadImageBuffer(buffer, "articles/secondary", ARTICLE_TAGS);

    await db.article.update({
      where: { id: articleId },
      data: { images: [...article.images, uploaded.url] },
    });

    revalidateArticle(articleId);
    return { success: true, data: { url: uploaded.url } };
  } catch (error) {
    logger.error({ error }, "Failed to upload secondary image");
    return { success: false, error: "Erreur lors de l'upload" };
  }
}

// ── Supprimer image secondaire ────────────────────────────────────────────────

export async function deleteArticleSecondaryImage(
  articleId: string,
  imageUrl: string
): Promise<Result> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const article = await db.article.findUnique({
      where: { id: articleId, deletedAt: null },
      select: { id: true, images: true },
    });
    if (!article) return { success: false, error: "Article introuvable" };

    if (!isCloudinaryUrl(imageUrl) || !article.images.includes(imageUrl)) {
      return { success: false, error: "Image non trouvée sur cet article" };
    }

    await tryDeleteCloudinaryImage(imageUrl);

    await db.article.update({
      where: { id: articleId },
      data: { images: article.images.filter((img) => img !== imageUrl) },
    });

    revalidateArticle(articleId);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete secondary image");
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ── Définir image principale depuis secondaire ────────────────────────────────

export async function setArticleMainImage(
  articleId: string,
  newMainUrl: string
): Promise<Result> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const article = await db.article.findUnique({
      where: { id: articleId, deletedAt: null },
      select: { id: true, mainImage: true, images: true },
    });
    if (!article) return { success: false, error: "Article introuvable" };

    if (!isCloudinaryUrl(newMainUrl) || !article.images.includes(newMainUrl)) {
      return { success: false, error: "Image non trouvée sur cet article" };
    }

    // Swap: new main comes from secondary, old main goes to secondary
    const newImages = article.images.filter((img) => img !== newMainUrl);
    if (article.mainImage) newImages.unshift(article.mainImage);

    await db.article.update({
      where: { id: articleId },
      data: { mainImage: newMainUrl, images: newImages },
    });

    revalidateArticle(articleId);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to set main image");
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ── Supprimer toutes les images (utilisé lors de la suppression article) ───────

export async function deleteAllArticleImages(articleId: string): Promise<Result> {
  try {
    const user = await getSession();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.delete.all");

    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { mainImage: true, images: true },
    });

    const urls = [
      ...(article?.images ?? []),
      ...(article?.mainImage ? [article.mainImage] : []),
    ];
    await Promise.allSettled(urls.map((url) => tryDeleteCloudinaryImage(url)));

    await db.article.update({
      where: { id: articleId },
      data: { mainImage: null, images: [] },
    });

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete all article images");
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
