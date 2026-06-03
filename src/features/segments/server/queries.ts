import "server-only";

import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  SegmentDTO,
  SegmentListDTO,
  SegmentMemberDTO,
  SegmentPreviewResult,
  CriteriaGroupDTO,
  CriterionDTO,
} from "../types";

// ── Mapper ────────────────────────────────────────────────────────────────────

type SegmentRow = Prisma.SegmentGetPayload<{
  include: {
    createdBy: { select: { name: true } };
    _count: { select: { members: true } };
  };
}>;

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
    include: {
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
    include: {
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
      include: {
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

export function buildWhereFromCriteria(
  criteria: CriteriaGroupDTO
): Prisma.ClientWhereInput {
  const conditions = criteria.criteria.map((c: CriterionDTO) => {
    switch (c.field) {
      case "totalSpent":
      case "averageBasket":
        return buildNumberCondition(
          c.field,
          c.operator,
          Number(c.value),
          c.value2 != null ? Number(c.value2) : undefined
        );

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

      default:
        return {} as Prisma.ClientWhereInput;
    }
  });

  const valid = conditions.filter((c) => Object.keys(c).length > 0);
  if (valid.length === 0) return {};

  return criteria.operator === "AND" ? { AND: valid } : { OR: valid };
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
    ...buildWhereFromCriteria(criteria),
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
    ...buildWhereFromCriteria(criteria),
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
