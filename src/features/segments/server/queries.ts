import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type {
  SegmentDTO,
  SegmentListDTO,
  SegmentMemberDTO,
  SegmentPreviewResult,
  CriteriaGroupDTO,
  CriterionDTO,
} from "../types";

const PRODUCT_CRITERIA_FIELDS = new Set([
  "hasOrderedArticle",
  "hasNotOrderedArticle",
  "hasOrderedCategory",
  "hasNotOrderedCategory",
  "hasOrderedArticleInPeriod",
  "hasOrderedCategoryInPeriod",
]);

// ── Mapper ────────────────────────────────────────────────────────────────────

type SegmentRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  type: "STATIC" | "DYNAMIC";
  isSystem: boolean;
  isActive: boolean;
  autoRefresh: boolean;
  memberCount: number;
  criteria: Prisma.JsonValue;
  lastRefreshedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { name: string | null } | null;
  _count: { members: number };
};

function toSegmentDTO(s: SegmentRow): SegmentDTO {
  const criteria =
    s.criteria && typeof s.criteria === "object" && Object.keys(s.criteria).length > 0
      ? (s.criteria as unknown as CriteriaGroupDTO)
      : null;

  return {
    id: s.id,
    name: s.name,
    description: s.description,
    color: s.color ?? "#8B6914",
    icon: s.icon,
    type: s.type,
    isSystem: s.isSystem,
    isActive: s.isActive,
    autoRefresh: s.autoRefresh,
    memberCount: s.memberCount,
    criteria,
    lastRefreshedAt: s.lastRefreshedAt,
    createdAt: s.createdAt,
    createdByName: s.createdBy?.name ?? null,
  };
}

// ── Liste complète ────────────────────────────────────────────────────────────

export async function getAllSegments(): Promise<SegmentListDTO> {
  const all = await db.segment.findMany({
    orderBy: [{ type: "asc" }, { memberCount: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      icon: true,
      type: true,
      isSystem: true,
      isActive: true,
      autoRefresh: true,
      memberCount: true,
      criteria: true,
      lastRefreshedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });

  const groups = all.filter((s) => s.type === "STATIC");
  const segments = all.filter((s) => s.type === "DYNAMIC");

  const distinctMembers = await db.segmentMember.findMany({
    select: { clientId: true },
    distinct: ["clientId"],
  });

  return {
    segments: segments.map(toSegmentDTO),
    groups: groups.map(toSegmentDTO),
    stats: {
      totalSegments: segments.length,
      totalGroups: groups.length,
      totalClients: distinctMembers.length,
    },
  };
}

// ── Détail ────────────────────────────────────────────────────────────────────

export async function getSegmentById(
  id: string,
  page = 1,
  limit = 25
): Promise<{ segment: SegmentDTO; members: SegmentMemberDTO[]; total: number } | null> {
  const segment = await db.segment.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      icon: true,
      type: true,
      isSystem: true,
      isActive: true,
      autoRefresh: true,
      memberCount: true,
      criteria: true,
      lastRefreshedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!segment) return null;

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    db.segmentMember.findMany({
      where: { segmentId: id },
      skip,
      take: limit,
      orderBy: { addedAt: "desc" },
      select: {
        clientId: true,
        addedAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            city: true,
            isVip: true,
            totalSpent: true,
          },
        },
      },
    }),
    db.segmentMember.count({ where: { segmentId: id } }),
  ]);

  return {
    segment: toSegmentDTO(segment),
    members: members.map((m) => ({
      clientId: m.clientId,
      clientName: `${m.client.firstName} ${m.client.lastName ?? ""}`.trim(),
      clientPhone: m.client.phone,
      clientCity: m.client.city,
      isVip: m.client.isVip,
      totalSpent: Number(m.client.totalSpent),
      addedAt: m.addedAt,
    })),
    total,
  };
}

// ── Constructeur de clause WHERE Prisma ───────────────────────────────────────

export async function buildWhereFromCriteria(
  criteria: CriteriaGroupDTO
): Promise<Prisma.ClientWhereInput> {
  const conditions = await Promise.all(
    criteria.criteria.map((c: CriterionDTO) => buildSingleCondition(c))
  );

  const valid = conditions.filter((c) => Object.keys(c).length > 0);
  if (valid.length === 0) return {};

  return criteria.operator === "AND" ? { AND: valid } : { OR: valid };
}

async function buildSingleCondition(c: CriterionDTO): Promise<Prisma.ClientWhereInput> {
  switch (c.field) {
    case "totalSpent":
    case "averageBasket":
    case "totalOrders":
      return buildNumberCondition(
        c.field,
        c.operator,
        Number(c.value),
        c.value2 != null ? Number(c.value2) : undefined
      );

    case "lastPurchaseAt":
    case "firstPurchaseAt":
    case "createdAt":
      return buildDateCondition(c.field, c.operator, c.value, c.value2);

    case "city":
    case "district":
    case "source":
      return buildStringCondition(c.field, c.operator, String(c.value));

    case "status":
      return { status: c.value as Prisma.EnumClientStatusFilter };

    case "rfmScore":
      return { rfmScore: String(c.value) };

    case "isVip":
    case "smsConsent":
    case "whatsappConsent":
    case "emailConsent":
      return { [c.field]: c.operator === "is_true" };

    case "hasOrderedArticle":
      return buildArticleCondition(c, true);

    case "hasNotOrderedArticle":
      return buildArticleCondition(c, false);

    case "hasOrderedCategory":
      return buildCategoryCondition(c, true);

    case "hasNotOrderedCategory":
      return buildCategoryCondition(c, false);

    case "hasOrderedArticleInPeriod":
      return buildArticleCondition(c, true, c.periodDays ?? undefined);

    case "hasOrderedCategoryInPeriod":
      return buildCategoryCondition(c, true, c.periodDays ?? undefined);

    default:
      return {};
  }
}

// ── Critères produit : a acheté / n'a pas acheté un article ──────────────────
// (ou un article dans une fenêtre de N derniers jours)

const IMPOSSIBLE_MATCH: Prisma.ClientWhereInput = { id: "__no_match__" };

async function buildArticleCondition(
  c: CriterionDTO,
  hasOrdered: boolean,
  periodDays?: number
): Promise<Prisma.ClientWhereInput> {
  if (!c.articleId) return {};

  const clientIds = await getClientIdsWhoOrdered({ articleId: c.articleId, periodDays });

  if (hasOrdered) {
    return clientIds.length > 0 ? { id: { in: clientIds } } : IMPOSSIBLE_MATCH;
  }
  return clientIds.length > 0 ? { id: { notIn: clientIds } } : {};
}

// ── Critères produit : a acheté / n'a pas acheté dans une catégorie ──────────
// (inclut les sous-catégories, jusqu'à 2 niveaux de profondeur)

async function buildCategoryCondition(
  c: CriterionDTO,
  hasOrdered: boolean,
  periodDays?: number
): Promise<Prisma.ClientWhereInput> {
  if (!c.categoryId) return {};

  const categoryIds = await getAllChildCategoryIds(c.categoryId);
  const clientIds = await getClientIdsWhoOrdered({ categoryIds, periodDays });

  if (hasOrdered) {
    return clientIds.length > 0 ? { id: { in: clientIds } } : IMPOSSIBLE_MATCH;
  }
  return clientIds.length > 0 ? { id: { notIn: clientIds } } : {};
}

// ── Résout les clientIds ayant acheté un article / une catégorie donnée ──────

async function getClientIdsWhoOrdered(opts: {
  articleId?: string;
  categoryIds?: string[];
  periodDays?: number;
}): Promise<string[]> {
  const from = opts.periodDays
    ? new Date(Date.now() - opts.periodDays * 86_400_000)
    : undefined;

  const sales = await db.sale.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      clientId: { not: null },
      ...(from && { soldAt: { gte: from } }),
      items: {
        some: opts.articleId
          ? { articleId: opts.articleId }
          : { article: { categoryId: { in: opts.categoryIds } } },
      },
    },
    select: { clientId: true },
    distinct: ["clientId"],
  });

  return sales.map((s) => s.clientId).filter((id): id is string => id !== null);
}

// ── Charge les IDs d'une catégorie et de ses sous-catégories (2 niveaux) ──────

async function getAllChildCategoryIds(categoryId: string): Promise<string[]> {
  const result = new Set<string>([categoryId]);

  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  for (const child of children) {
    result.add(child.id);
    const grandChildren = await db.category.findMany({
      where: { parentId: child.id },
      select: { id: true },
    });
    grandChildren.forEach((gc) => result.add(gc.id));
  }

  return [...result];
}

function buildNumberCondition(
  field: string,
  operator: string,
  value: number,
  value2?: number
): Prisma.ClientWhereInput {
  switch (operator) {
    case "gt":
      return { [field]: { gt: value } };
    case "gte":
      return { [field]: { gte: value } };
    case "lt":
      return { [field]: { lt: value } };
    case "lte":
      return { [field]: { lte: value } };
    case "eq":
      return { [field]: value };
    case "between":
      return { [field]: { gte: value, lte: value2 ?? value } };
    default:
      return {};
  }
}

function buildDateCondition(
  field: string,
  operator: string,
  value: CriterionDTO["value"],
  value2?: CriterionDTO["value2"]
): Prisma.ClientWhereInput {
  switch (operator) {
    case "after":
      return { [field]: { gte: new Date(String(value)) } };
    case "before":
      return { [field]: { lte: new Date(String(value)) } };
    case "between":
      return {
        [field]: {
          gte: new Date(String(value)),
          lte: new Date(String(value2)),
        },
      };
    case "last_days": {
      const days = Number(value);
      const since = new Date();
      since.setDate(since.getDate() - days);
      return { [field]: { gte: since } };
    }
    default:
      return {};
  }
}

function buildStringCondition(
  field: string,
  operator: string,
  value: string
): Prisma.ClientWhereInput {
  switch (operator) {
    case "eq":
      return { [field]: { equals: value, mode: "insensitive" as const } };
    case "contains":
      return { [field]: { contains: value, mode: "insensitive" as const } };
    default:
      return {};
  }
}

// ── Prévisualisation ──────────────────────────────────────────────────────────

export async function previewSegmentCriteria(
  criteria: CriteriaGroupDTO
): Promise<SegmentPreviewResult> {
  const where: Prisma.ClientWhereInput = {
    deletedAt: null,
    status: { not: "DELETED" },
    ...(await buildWhereFromCriteria(criteria)),
  };

  const [count, sample] = await Promise.all([
    db.client.count({ where }),
    db.client.findMany({
      where,
      take: 5,
      orderBy: { totalSpent: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
      },
    }),
  ]);

  return { count, sample };
}

// ── Rafraîchir un segment dynamique ──────────────────────────────────────────

export async function refreshDynamicSegment(segmentId: string): Promise<number> {
  const segment = await db.segment.findUnique({
    where: { id: segmentId },
    select: { id: true, type: true, criteria: true },
  });

  if (!segment || segment.type !== "DYNAMIC") return 0;
  if (!segment.criteria || Object.keys(segment.criteria).length === 0) return 0;

  const criteria = segment.criteria as unknown as CriteriaGroupDTO;
  const where: Prisma.ClientWhereInput = {
    deletedAt: null,
    status: { not: "DELETED" },
    ...(await buildWhereFromCriteria(criteria)),
  };

  const matchingClients = await db.client.findMany({
    where,
    select: { id: true },
    take: 10_000,
  });

  const clientIds = matchingClients.map((c) => c.id);

  await db.$transaction([
    db.segmentMember.deleteMany({ where: { segmentId } }),
    ...(clientIds.length > 0
      ? [
          db.segmentMember.createMany({
            data: clientIds.map((clientId) => ({ segmentId, clientId })),
            skipDuplicates: true,
          }),
        ]
      : []),
    db.segment.update({
      where: { id: segmentId },
      data: {
        memberCount: clientIds.length,
        lastRefreshedAt: new Date(),
      },
    }),
  ]);

  return clientIds.length;
}

// ── Rafraîchir les segments dynamiques à critères produit/catégorie ──────────
// Appelé en tâche de fond après une vente (voir segment.worker.ts). On ne
// rafraîchit que les segments concernés par un achat, pas tous les segments,
// pour limiter la charge DB déclenchée par chaque vente.

export async function refreshProductBasedSegments(): Promise<number> {
  const segments = await db.segment.findMany({
    where: { type: "DYNAMIC", isActive: true, autoRefresh: true },
    select: { id: true, name: true, criteria: true },
  });

  const productSegments = segments.filter((s) => {
    const criteria = s.criteria as unknown as CriteriaGroupDTO | null;
    return criteria?.criteria?.some((c) => PRODUCT_CRITERIA_FIELDS.has(c.field));
  });

  let refreshed = 0;
  const chunkSize = 5;
  for (let i = 0; i < productSegments.length; i += chunkSize) {
    const chunk = productSegments.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (segment) => {
        try {
          await refreshDynamicSegment(segment.id);
          refreshed++;
        } catch (error) {
          logger.error(
            { error, segmentId: segment.id },
            `Failed to refresh product-based segment "${segment.name}"`
          );
        }
      })
    );
  }

  return refreshed;
}

// ── Articles pour le picker de critères produit ──────────────────────────────

export async function getArticlesForCriteriaPicker(
  search?: string
): Promise<
  Array<{ id: string; name: string; reference: string; categoryName: string | null }>
> {
  const articles = await db.article.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["ARCHIVED", "DISCONTINUED"] },
      ...(search?.trim() && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { reference: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      reference: true,
      category: { select: { name: true } },
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return articles.map((a) => ({
    id: a.id,
    name: a.name,
    reference: a.reference,
    categoryName: a.category?.name ?? null,
  }));
}

// ── Catégories pour le picker de critères produit ────────────────────────────

export async function getCategoriesForCriteriaPicker(): Promise<
  Array<{ id: string; name: string; parentName: string | null }>
> {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      parent: { select: { name: true } },
    },
    orderBy: [{ name: "asc" }],
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));
}

// ── Clients non membres d'un groupe (pour l'ajout) ───────────────────────────

export async function getClientsNotInGroup(
  groupId: string,
  search?: string,
  limit = 20
): Promise<
  Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    city: string | null;
  }>
> {
  const existingIds = await db.segmentMember.findMany({
    where: { segmentId: groupId },
    select: { clientId: true },
  });
  const exclude = existingIds.map((m) => m.clientId);

  return db.client.findMany({
    where: {
      deletedAt: null,
      status: { not: "DELETED" },
      ...(exclude.length > 0 && { id: { notIn: exclude } }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }),
    },
    select: { id: true, firstName: true, lastName: true, phone: true, city: true },
    take: limit,
    orderBy: { firstName: "asc" },
  });
}
