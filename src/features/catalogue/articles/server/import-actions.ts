"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { z } from "zod";
import type { MappedArticleRow } from "../lib/import-mapper";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

const importRowServerSchema = z.object({
  reference: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9\-_]+$/, "Référence invalide"),
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(300).nullable(),
  categoryName: z.string().nullable(),
  brand: z.string().max(100).nullable(),
  supplier: z.string().max(100).nullable(),
  color: z.string().max(100).nullable(),
  material: z.string().max(100).nullable(),
  dimensions: z.string().max(100).nullable(),
  weight: z.number().positive().nullable(),
  price: z.number().min(0),
  promoPrice: z.number().min(0).nullable(),
  costPrice: z.number().min(0).nullable(),
  stock: z.number().int().min(0),
  stockAlert: z.number().int().min(0),
  status: z.enum([
    "AVAILABLE",
    "OUT_OF_STOCK",
    "COMING_SOON",
    "ARCHIVED",
    "DISCONTINUED",
  ]),
  isNew: z.boolean(),
  tags: z.array(z.string()),
  barcode: z.string().nullable(),
});

export interface ImportArticlesResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ row: number; reference: string; error: string }>;
}

export async function importArticles(
  rows: MappedArticleRow[]
): Promise<Result<ImportArticlesResult>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    await checkPermission("articles.import.all");

    if (rows.length === 0) return { success: false, error: "Aucune ligne à importer" };
    if (rows.length > 2000)
      return {
        success: false,
        error: "Maximum 2000 articles par import",
      };

    const validRows = rows.filter((r) => r.isValid && r.price !== null);

    if (validRows.length === 0) {
      return {
        success: false,
        error: "Aucune ligne valide à importer. Corrigez les erreurs.",
      };
    }

    // Résoudre les catégories en une seule requête
    const categoryNames = [
      ...new Set(
        validRows.map((r) => r.categoryName).filter((n): n is string => n !== null)
      ),
    ];

    const categories =
      categoryNames.length > 0
        ? await db.category.findMany({
            where: { name: { in: categoryNames, mode: "insensitive" } },
            select: { id: true, name: true },
          })
        : [];

    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    const result: ImportArticlesResult = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: rows.length - validRows.length,
      errors: 0,
      errorDetails: [],
    };

    const BATCH_SIZE = 50;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            const parsed = importRowServerSchema.safeParse(row);
            if (!parsed.success) {
              result.errors++;
              result.errorDetails.push({
                row: row.rowIndex,
                reference: row.reference,
                error: parsed.error.issues.map((e) => e.message).join(", "),
              });
              return;
            }

            const data = parsed.data;
            const categoryId = data.categoryName
              ? (categoryMap.get(data.categoryName.toLowerCase()) ?? null)
              : null;

            if (data.categoryName && !categoryId) {
              result.errorDetails.push({
                row: row.rowIndex,
                reference: data.reference,
                error: `Catégorie "${data.categoryName}" introuvable — article créé sans catégorie`,
              });
            }

            const existing = await db.article.findUnique({
              where: { reference: data.reference },
              select: { id: true },
            });

            if (existing) {
              // Update : ne pas écraser mainImage, images, videoUrl existants
              await db.article.update({
                where: { id: existing.id },
                data: {
                  name: data.name,
                  shortDescription: data.shortDescription,
                  categoryId,
                  brand: data.brand,
                  supplier: data.supplier,
                  color: data.color,
                  material: data.material,
                  dimensions: data.dimensions,
                  weight: data.weight,
                  price: data.price,
                  promoPrice: data.promoPrice,
                  costPrice: data.costPrice,
                  currency: "XOF",
                  stock: data.stock,
                  stockAlert: data.stockAlert,
                  status: data.status,
                  isNew: data.isNew,
                  // barcode uniquement si fourni (évite conflit @unique)
                  ...(data.barcode !== null && { barcode: data.barcode }),
                  tags: data.tags,
                },
              });
              result.updated++;
            } else {
              await db.article.create({
                data: {
                  reference: data.reference,
                  name: data.name,
                  shortDescription: data.shortDescription,
                  categoryId,
                  brand: data.brand,
                  supplier: data.supplier,
                  color: data.color,
                  material: data.material,
                  dimensions: data.dimensions,
                  weight: data.weight,
                  price: data.price,
                  promoPrice: data.promoPrice,
                  costPrice: data.costPrice,
                  currency: "XOF",
                  stock: data.stock,
                  stockAlert: data.stockAlert,
                  status: data.status,
                  isNew: data.isNew,
                  barcode: data.barcode,
                  tags: data.tags,
                  images: [],
                },
              });
              result.created++;
            }
          } catch (err) {
            result.errors++;
            const msg = err instanceof Error ? err.message : "Erreur inconnue";
            result.errorDetails.push({
              row: row.rowIndex,
              reference: row.reference,
              error: msg,
            });
          }
        })
      );
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "articles.import",
        entity: "Article",
        newValue: {
          total: result.total,
          created: result.created,
          updated: result.updated,
          errors: result.errors,
        },
        status: "success",
      },
    });

    revalidatePath("/catalogue/articles");
    return { success: true, data: result };
  } catch (error) {
    logger.error({ error }, "Failed to import articles");
    return {
      success: false,
      error: "Une erreur est survenue lors de l'import",
    };
  }
}

export async function getExistingReferences(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const articles = await db.article.findMany({
    where: { deletedAt: null },
    select: { reference: true },
  });

  return articles.map((a) => a.reference);
}
