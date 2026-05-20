"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  generateSlug,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ReorderCategoriesInput,
} from "../schemas/category.schema";
import { wouldCreateCycle } from "./queries";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

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
      entity: "Category",
      entityId,
      newValue: meta,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.ARTICLES_MANAGE_CATEGORIES);

    const data = createCategorySchema.parse(input);

    let slug = generateSlug(data.name);
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    if (data.parentId) {
      const parent = await db.category.findUnique({ where: { id: data.parentId } });
      if (!parent) return { success: false, error: "Catégorie parente introuvable" };
    }

    const category = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        parentId: data.parentId || null,
        icon: data.icon || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    await audit(user.id, "category.create", category.id, {
      name: data.name,
      parentId: data.parentId ?? null,
    });

    revalidatePath("/catalogue/categories");
    return { success: true, data: { id: category.id } };
  } catch (error) {
    logger.error({ error }, "Failed to create category");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.ARTICLES_MANAGE_CATEGORIES);

    const data = updateCategorySchema.parse(input);

    if (data.parentId === categoryId) {
      return {
        success: false,
        error: "Une catégorie ne peut pas être son propre parent",
      };
    }

    if (data.parentId) {
      const cycle = await wouldCreateCycle(categoryId, data.parentId);
      if (cycle) {
        return {
          success: false,
          error: "Cette assignation créerait une boucle dans l'arbre des catégories",
        };
      }
    }

    const old = await db.category.findUnique({
      where: { id: categoryId },
      select: { name: true, parentId: true, isActive: true },
    });

    await db.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description || null,
        parentId: data.parentId ?? null,
        icon: data.icon || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    await audit(user.id, "category.update", categoryId, {
      before: old as Prisma.InputJsonObject,
      after: { name: data.name, parentId: data.parentId ?? null },
    });

    revalidatePath("/catalogue/categories");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to update category");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.ARTICLES_MANAGE_CATEGORIES);

    await db.category.update({ where: { id: categoryId }, data: { isActive } });

    await audit(
      user.id,
      isActive ? "category.activate" : "category.deactivate",
      categoryId
    );

    revalidatePath("/catalogue/categories");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to toggle category");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.ARTICLES_MANAGE_CATEGORIES);

    const articleCount = await db.article.count({ where: { categoryId } });
    if (articleCount > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : ${articleCount} article(s) utilisent cette catégorie. Réassignez-les d'abord.`,
      };
    }

    const childCount = await db.category.count({ where: { parentId: categoryId } });
    if (childCount > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : ${childCount} sous-catégorie(s) dépendent de cette catégorie. Supprimez-les d'abord.`,
      };
    }

    const cat = await db.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    await db.category.delete({ where: { id: categoryId } });

    await audit(user.id, "category.delete", categoryId, { name: cat?.name ?? "" });

    revalidatePath("/catalogue/categories");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete category");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function reorderCategories(input: ReorderCategoriesInput): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.ARTICLES_MANAGE_CATEGORIES);

    const data = reorderCategoriesSchema.parse(input);

    await db.$transaction(
      data.items.map((item) =>
        db.category.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            parentId: item.parentId ?? null,
          },
        })
      )
    );

    await audit(user.id, "category.reorder", undefined, {
      count: data.items.length,
    });

    revalidatePath("/catalogue/categories");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to reorder categories");
    return { success: false, error: "Une erreur est survenue" };
  }
}
