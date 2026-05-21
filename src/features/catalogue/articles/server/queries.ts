import "server-only";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions/server";
import type {
  ArticleListItemDTO,
  ArticleDetailDTO,
  ArticleCostDTO,
  PaginatedArticles,
  ArticleStats,
  StockLevel,
  ArticleStatusType,
} from "../types";
import type { ArticleFilters } from "../schemas/article.schema";

// ── Helpers ────────────────────────────────────────────────────────────────

function isOnPromo(
  promoPrice: unknown,
  promoStartDate: Date | null,
  promoEndDate: Date | null
): boolean {
  if (!promoPrice) return false;
  const now = new Date();
  if (promoStartDate && now < promoStartDate) return false;
  if (promoEndDate && now > promoEndDate) return false;
  return true;
}

function getStockLevel(stock: number, stockAlert: number): StockLevel {
  if (stock === 0) return "empty";
  if (stock <= stockAlert) return "low";
  return "ok";
}

type CategoryNode = {
  name: string;
  parent?: CategoryNode | null;
} | null;

function buildCategoryPath(category: CategoryNode): string | null {
  if (!category) return null;
  const parts = [category.name];
  let current = category.parent ?? null;
  while (current) {
    parts.unshift(current.name);
    current = current.parent ?? null;
  }
  return parts.join(" > ");
}

type ArticleRow = {
  id: string;
  reference: string;
  barcode: string | null;
  name: string;
  shortDescription: string | null;
  categoryId: string | null;
  brand: string | null;
  mainImage: string | null;
  price: { toNumber(): number } | number;
  promoPrice: { toNumber(): number } | number | null;
  promoStartDate: Date | null;
  promoEndDate: Date | null;
  currency: string;
  stock: number;
  stockAlert: number;
  status: ArticleStatusType;
  isNew: boolean;
  arrivalDate: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  category: CategoryNode;
};

function toListItem(a: ArticleRow): ArticleListItemDTO {
  const price = typeof a.price === "number" ? a.price : a.price.toNumber();
  const promoPrice =
    a.promoPrice === null || a.promoPrice === undefined
      ? null
      : typeof a.promoPrice === "number"
        ? a.promoPrice
        : a.promoPrice.toNumber();

  return {
    id: a.id,
    reference: a.reference,
    barcode: a.barcode,
    name: a.name,
    shortDescription: a.shortDescription,
    categoryId: a.categoryId,
    categoryName: a.category?.name ?? null,
    categoryPath: buildCategoryPath(a.category),
    brand: a.brand,
    mainImage: a.mainImage,
    price,
    promoPrice,
    promoStartDate: a.promoStartDate,
    promoEndDate: a.promoEndDate,
    currency: a.currency,
    stock: a.stock,
    stockAlert: a.stockAlert,
    status: a.status,
    isNew: a.isNew,
    arrivalDate: a.arrivalDate,
    tags: a.tags ?? [],
    isOnPromo: isOnPromo(promoPrice, a.promoStartDate, a.promoEndDate),
    stockLevel: getStockLevel(a.stock, a.stockAlert),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

const CATEGORY_SELECT = {
  name: true,
  parent: {
    select: {
      name: true,
      parent: {
        select: {
          name: true,
          parent: { select: { name: true } },
        },
      },
    },
  },
} as const;

// costPrice délibérément EXCLU — DTO séparé avec RBAC
const LIST_SELECT = {
  id: true,
  reference: true,
  barcode: true,
  name: true,
  shortDescription: true,
  categoryId: true,
  brand: true,
  mainImage: true,
  price: true,
  promoPrice: true,
  promoStartDate: true,
  promoEndDate: true,
  currency: true,
  stock: true,
  stockAlert: true,
  status: true,
  isNew: true,
  arrivalDate: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  category: { select: CATEGORY_SELECT },
} as const;

// ── Queries publiques ──────────────────────────────────────────────────────

export async function getArticles(filters: ArticleFilters): Promise<PaginatedArticles> {
  const skip = (filters.page - 1) * filters.limit;
  const now = new Date();

  const where = buildWhereClause(filters, now);
  const orderBy = { [filters.sortBy]: filters.sortDir };

  const [articles, total, stats] = await Promise.all([
    db.article.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy,
      select: LIST_SELECT,
    }),
    db.article.count({ where }),
    getArticleStats(),
  ]);

  return {
    articles: articles.map(toListItem),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats,
  };
}

function buildWhereClause(filters: ArticleFilters, now: Date) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (filters.status) where.status = filters.status;
  if (filters.isNew !== undefined) where.isNew = filters.isNew;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brand) where.brand = { contains: filters.brand, mode: "insensitive" };
  if (filters.minPrice !== undefined) where.price = { gte: filters.minPrice };
  if (filters.maxPrice !== undefined) {
    where.price = { ...(where.price as object | undefined), lte: filters.maxPrice };
  }

  if (filters.inPromo === true) {
    where.promoPrice = { not: null };
    where.OR = [
      { promoStartDate: null, promoEndDate: null },
      { promoStartDate: { lte: now }, promoEndDate: { gte: now } },
      { promoStartDate: null, promoEndDate: { gte: now } },
      { promoStartDate: { lte: now }, promoEndDate: null },
    ];
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { reference: { contains: filters.search, mode: "insensitive" } },
      { barcode: { contains: filters.search } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

// costPrice délibérément EXCLU — utiliser getArticleCost séparément
export async function getArticleById(id: string): Promise<ArticleDetailDTO | null> {
  const a = await db.article.findUnique({
    where: { id, deletedAt: null },
    select: {
      ...LIST_SELECT,
      description: true,
      supplier: true,
      color: true,
      material: true,
      dimensions: true,
      weight: true,
      attributes: true,
      images: true,
      videoUrl: true,
      metadata: true,
    },
  });

  if (!a) return null;

  return {
    ...toListItem(a as ArticleRow),
    description: a.description,
    supplier: a.supplier,
    color: a.color,
    material: a.material,
    dimensions: a.dimensions,
    weight: a.weight,
    attributes: (a.attributes as Record<string, string>) ?? {},
    images: a.images ?? [],
    videoUrl: a.videoUrl,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
  };
}

// Requiert articles.view_cost — vérifié en interne (défense en profondeur)
export async function getArticleCost(articleId: string): Promise<ArticleCostDTO | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const can = await hasPermission("articles.view_cost");
  if (!can) return null;

  const a = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, price: true, costPrice: true },
  });

  if (!a) return null;

  const price =
    typeof a.price === "number"
      ? a.price
      : (a.price as { toNumber(): number }).toNumber();
  const cost =
    a.costPrice === null
      ? null
      : typeof a.costPrice === "number"
        ? a.costPrice
        : (a.costPrice as { toNumber(): number }).toNumber();

  return {
    id: a.id,
    costPrice: cost,
    margin: cost ? Math.round(((price - cost) / price) * 100) : null,
    marginAmount: cost ? price - cost : null,
  };
}

export async function getArticleStats(): Promise<ArticleStats> {
  const now = new Date();

  const [total, available, outOfStock, newArrivals, inPromo, lowStockArticles] =
    await Promise.all([
      db.article.count({ where: { deletedAt: null } }),
      db.article.count({ where: { deletedAt: null, status: "AVAILABLE" } }),
      db.article.count({ where: { deletedAt: null, status: "OUT_OF_STOCK" } }),
      db.article.count({ where: { deletedAt: null, isNew: true } }),
      db.article.count({
        where: {
          deletedAt: null,
          promoPrice: { not: null },
          OR: [
            { promoStartDate: null, promoEndDate: null },
            { promoStartDate: { lte: now }, promoEndDate: { gte: now } },
            { promoStartDate: null, promoEndDate: { gte: now } },
            { promoStartDate: { lte: now }, promoEndDate: null },
          ],
        },
      }),
      // lowStock : stock > 0 ET stock <= stockAlert — via raw pour comparer 2 colonnes
      db.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count
        FROM articles
        WHERE "deletedAt" IS NULL
          AND stock > 0
          AND stock <= "stockAlert"
      `,
    ]);

  return {
    total,
    available,
    outOfStock,
    lowStock: Number(lowStockArticles[0]?.count ?? 0),
    newArrivals,
    inPromo,
  };
}

export async function getArticlesForExport(
  filters: Partial<ArticleFilters>
): Promise<ArticleListItemDTO[]> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  const articles = await db.article.findMany({
    where,
    select: LIST_SELECT,
    orderBy: { name: "asc" },
    take: 10_000,
  });

  return articles.map(toListItem);
}

export async function isReferenceUnique(
  reference: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await db.article.findFirst({
    where: {
      reference: reference.toUpperCase(),
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return !existing;
}

export async function getDistinctBrands(): Promise<string[]> {
  const rows = await db.article.findMany({
    where: { deletedAt: null, brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!).filter(Boolean);
}
