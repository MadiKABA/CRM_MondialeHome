"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { checkPermission, hasPermission } from "@/lib/permissions/server";
import {
  articleSchema,
  bulkArticleActionSchema,
  updateStockSchema,
  type ArticleInput,
  type ArticleFilters,
  type BulkArticleActionInput,
  type UpdateStockInput,
} from "../schemas/article.schema";
import { isReferenceUnique } from "./queries";
import type { ActionResult, ArticleListItemDTO } from "../types";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function audit(
  userId: string,
  action: string,
  entityId?: string,
  meta?: Prisma.InputJsonObject
) {
  const h = await headers();
  await db.auditLog.create({
    data: {
      userId,
      action,
      entity: "Article",
      entityId: entityId ?? null,
      newValue: meta,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

// ── CRÉER ──────────────────────────────────────────────────────────────────

export async function createArticle(
  input: ArticleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.create.all");

    const data = articleSchema.parse(input);

    if (data.promoPrice !== null && data.promoPrice !== undefined) {
      const canManagePrices = await hasPermission("articles.manage_prices");
      if (!canManagePrices) {
        return {
          success: false,
          error: "Vous n'êtes pas autorisé à définir des promotions",
        };
      }
    }

    if (data.costPrice !== null && data.costPrice !== undefined) {
      const canViewCost = await hasPermission("articles.view_cost");
      if (!canViewCost) {
        return {
          success: false,
          error: "Vous n'êtes pas autorisé à renseigner le prix d'achat",
        };
      }
    }

    const refUpper = data.reference.toUpperCase();
    const unique = await isReferenceUnique(refUpper);
    if (!unique) {
      return { success: false, error: `La référence "${refUpper}" existe déjà` };
    }

    const article = await db.article.create({
      data: {
        reference: refUpper,
        barcode: data.barcode || null,
        name: data.name,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brand: data.brand || null,
        supplier: data.supplier || null,
        color: data.color || null,
        material: data.material || null,
        dimensions: data.dimensions || null,
        weight: data.weight ?? null,
        attributes: (data.attributes ?? {}) as Prisma.InputJsonObject,
        price: data.price,
        promoPrice: data.promoPrice ?? null,
        promoStartDate: data.promoStartDate ?? null,
        promoEndDate: data.promoEndDate ?? null,
        costPrice: data.costPrice ?? null,
        currency: data.currency,
        stock: data.stock,
        stockAlert: data.stockAlert,
        status: data.status,
        isNew: data.isNew,
        arrivalDate: data.arrivalDate ?? null,
        mainImage: data.mainImage ?? null,
        images: data.images ?? [],
        videoUrl: data.videoUrl || null,
        tags: data.tags ?? [],
        metadata: (data.metadata ?? {}) as Prisma.InputJsonObject,
      },
    });

    await audit(user.id, "article.create", article.id, {
      reference: article.reference,
      name: article.name,
    } satisfies Prisma.InputJsonObject);

    revalidatePath("/catalogue/articles");
    return { success: true, data: { id: article.id } };
  } catch (err) {
    logger.error({ err }, "Failed to create article");
    return { success: false, error: "Une erreur est survenue lors de la création" };
  }
}

// ── MODIFIER ───────────────────────────────────────────────────────────────

export async function updateArticle(
  articleId: string,
  input: ArticleInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const data = articleSchema.parse(input);

    if (data.promoPrice !== null && data.promoPrice !== undefined) {
      const canManagePrices = await hasPermission("articles.manage_prices");
      if (!canManagePrices) {
        return {
          success: false,
          error: "Vous n'êtes pas autorisé à modifier les promotions",
        };
      }
    }

    if (data.costPrice !== null && data.costPrice !== undefined) {
      const canViewCost = await hasPermission("articles.view_cost");
      if (!canViewCost) {
        return {
          success: false,
          error: "Vous n'êtes pas autorisé à modifier le prix d'achat",
        };
      }
    }

    const refUpper = data.reference.toUpperCase();
    const unique = await isReferenceUnique(refUpper, articleId);
    if (!unique) {
      return { success: false, error: `La référence "${refUpper}" est déjà utilisée` };
    }

    const old = await db.article.findUnique({
      where: { id: articleId },
      select: { name: true, price: true, status: true },
    });

    await db.article.update({
      where: { id: articleId },
      data: {
        reference: refUpper,
        barcode: data.barcode || null,
        name: data.name,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brand: data.brand || null,
        supplier: data.supplier || null,
        color: data.color || null,
        material: data.material || null,
        dimensions: data.dimensions || null,
        weight: data.weight ?? null,
        attributes: (data.attributes ?? {}) as Prisma.InputJsonObject,
        price: data.price,
        promoPrice: data.promoPrice ?? null,
        promoStartDate: data.promoStartDate ?? null,
        promoEndDate: data.promoEndDate ?? null,
        costPrice: data.costPrice ?? null,
        currency: data.currency,
        stock: data.stock,
        stockAlert: data.stockAlert,
        status: data.status,
        isNew: data.isNew,
        arrivalDate: data.arrivalDate ?? null,
        mainImage: data.mainImage ?? null,
        images: data.images ?? [],
        videoUrl: data.videoUrl || null,
        tags: data.tags ?? [],
        metadata: (data.metadata ?? {}) as Prisma.InputJsonObject,
      },
    });

    await audit(user.id, "article.update", articleId, {
      before: old ? { name: old.name, status: old.status } : null,
      after: { name: data.name, price: data.price, status: data.status },
    } satisfies Prisma.InputJsonObject);

    revalidatePath("/catalogue/articles");
    revalidatePath(`/catalogue/articles/${articleId}`);
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Failed to update article");
    return { success: false, error: "Une erreur est survenue lors de la modification" };
  }
}

// ── SUPPRIMER (soft delete) ────────────────────────────────────────────────

export async function deleteArticle(articleId: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.delete.all");

    const art = await db.article.findUnique({
      where: { id: articleId },
      select: { name: true, reference: true },
    });

    if (!art) return { success: false, error: "Article introuvable" };

    const saleItemCount = await db.saleItem.count({ where: { articleId } });

    await db.article.update({
      where: { id: articleId },
      data: { deletedAt: new Date(), status: "DISCONTINUED" },
    });

    await audit(user.id, "article.delete", articleId, {
      name: art.name,
      reference: art.reference,
      hadSales: saleItemCount > 0,
    } satisfies Prisma.InputJsonObject);

    revalidatePath("/catalogue/articles");
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Failed to delete article");
    return { success: false, error: "Une erreur est survenue lors de la suppression" };
  }
}

// ── STOCK ──────────────────────────────────────────────────────────────────

export async function updateArticleStock(input: UpdateStockInput): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const data = updateStockSchema.parse(input);

    const old = await db.article.findUnique({
      where: { id: data.articleId },
      select: { stock: true },
    });

    const newStatus = data.newStock === 0 ? "OUT_OF_STOCK" : "AVAILABLE";

    await db.article.update({
      where: { id: data.articleId },
      data: { stock: data.newStock, status: newStatus },
    });

    await audit(user.id, "article.stock.update", data.articleId, {
      before: old?.stock ?? null,
      after: data.newStock,
      reason: data.reason,
    } satisfies Prisma.InputJsonObject);

    revalidatePath("/catalogue/articles");
    revalidatePath(`/catalogue/articles/${data.articleId}`);
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Failed to update stock");
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du stock",
    };
  }
}

// ── EXPORT ─────────────────────────────────────────────────────────────────

export async function exportArticles(
  filters: Partial<ArticleFilters>
): Promise<ActionResult<{ articles: ArticleListItemDTO[] }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.export.all");

    const { getArticlesForExport } = await import("./queries");
    const articles = await getArticlesForExport(filters);

    return { success: true, data: { articles } };
  } catch (err) {
    logger.error({ err }, "Failed to export articles");
    return { success: false, error: "Une erreur est survenue lors de l'export" };
  }
}

// ── ACTIONS EN MASSE ───────────────────────────────────────────────────────

export async function bulkArticleAction(
  input: BulkArticleActionInput
): Promise<ActionResult<{ affected: number }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.update.all");

    const data = bulkArticleActionSchema.parse(input);

    if (data.action === "delete") {
      await checkPermission("articles.delete.all");
    }

    let affected = 0;

    if (data.action === "archive") {
      const result = await db.article.updateMany({
        where: { id: { in: data.articleIds } },
        data: { status: "ARCHIVED" },
      });
      affected = result.count;
    } else if (data.action === "activate") {
      const result = await db.article.updateMany({
        where: { id: { in: data.articleIds } },
        data: { status: "AVAILABLE" },
      });
      affected = result.count;
    } else if (data.action === "delete") {
      const result = await db.article.updateMany({
        where: { id: { in: data.articleIds } },
        data: { deletedAt: new Date(), status: "DISCONTINUED" },
      });
      affected = result.count;
    } else if (data.action === "set_new") {
      const result = await db.article.updateMany({
        where: { id: { in: data.articleIds } },
        data: { isNew: true },
      });
      affected = result.count;
    } else if (data.action === "unset_new") {
      const result = await db.article.updateMany({
        where: { id: { in: data.articleIds } },
        data: { isNew: false },
      });
      affected = result.count;
    }

    await audit(user.id, `article.bulk.${data.action}`, undefined, {
      affected,
    } satisfies Prisma.InputJsonObject);

    revalidatePath("/catalogue/articles");
    return { success: true, data: { affected } };
  } catch (err) {
    logger.error({ err }, "Failed to bulk action articles");
    return { success: false, error: "Une erreur est survenue lors de l'action en masse" };
  }
}
