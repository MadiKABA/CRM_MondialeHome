import "server-only";

import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClientFilters } from "../schemas/client.schema";
import type {
  ClientListItemDTO,
  ClientDetailDTO,
  PaginatedClients,
  ConsentLogDTO,
  SellerDTO,
} from "../types";

type ClientRow = Prisma.ClientGetPayload<{
  select: {
    id: true;
    reference: true;
    firstName: true;
    lastName: true;
    fullName: true;
    gender: true;
    phone: true;
    whatsapp: true;
    email: true;
    city: true;
    district: true;
    source: true;
    status: true;
    isVip: true;
    smsConsent: true;
    whatsappConsent: true;
    emailConsent: true;
    totalSpent: true;
    totalOrders: true;
    lastPurchaseAt: true;
    createdAt: true;
    tags: true;
    assignedToId: true;
    assignedTo: { select: { id: true; name: true; image: true } };
  };
}>;

function toListItem(c: ClientRow): ClientListItemDTO {
  return {
    id: c.id,
    reference: c.reference,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: c.fullName,
    gender: c.gender,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    city: c.city,
    district: c.district,
    source: c.source,
    status: c.status,
    isVip: c.isVip,
    smsConsent: c.smsConsent,
    whatsappConsent: c.whatsappConsent,
    emailConsent: c.emailConsent,
    totalSpent: Number(c.totalSpent),
    totalOrders: c.totalOrders,
    lastPurchaseAt: c.lastPurchaseAt,
    createdAt: c.createdAt,
    tags: c.tags,
    assignedToId: c.assignedToId,
    assignedTo: c.assignedTo ?? null,
  };
}

const LIST_SELECT = {
  id: true,
  reference: true,
  firstName: true,
  lastName: true,
  fullName: true,
  gender: true,
  phone: true,
  whatsapp: true,
  email: true,
  city: true,
  district: true,
  source: true,
  status: true,
  isVip: true,
  smsConsent: true,
  whatsappConsent: true,
  emailConsent: true,
  totalSpent: true,
  totalOrders: true,
  lastPurchaseAt: true,
  createdAt: true,
  tags: true,
  assignedToId: true,
  assignedTo: { select: { id: true, name: true, image: true } },
} satisfies Prisma.ClientSelect;

function buildWhere(
  filters: Partial<ClientFilters>,
  currentUserId?: string
): Prisma.ClientWhereInput {
  return {
    deletedAt: null,
    ...(filters.status && { status: filters.status }),
    ...(filters.isVip !== undefined && { isVip: filters.isVip }),
    ...(filters.city && {
      city: { contains: filters.city, mode: "insensitive" as const },
    }),
    ...(filters.district && {
      district: { contains: filters.district, mode: "insensitive" as const },
    }),
    ...(filters.source && { source: filters.source }),
    ...(filters.tag && { tags: { has: filters.tag } }),
    ...(filters.hasPhone && { phone: { not: null } }),
    ...(filters.hasEmail && { email: { not: null } }),
    ...(filters.assigned === "me" && currentUserId
      ? { assignedToId: currentUserId }
      : {}),
    ...(filters.search && {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" as const } },
        { lastName: { contains: filters.search, mode: "insensitive" as const } },
        { fullName: { contains: filters.search, mode: "insensitive" as const } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: "insensitive" as const } },
        { reference: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };
}

export async function getClients(
  filters: ClientFilters,
  currentUserId?: string
): Promise<PaginatedClients> {
  const skip = (filters.page - 1) * filters.limit;
  const where = buildWhere(filters, currentUserId);
  const orderBy: Prisma.ClientOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [clients, total, active, vip, newThisMonth] = await Promise.all([
    db.client.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy,
      select: LIST_SELECT,
    }),
    db.client.count({ where }),
    db.client.count({ where: { ...where, status: "ACTIVE" } }),
    db.client.count({ where: { ...where, isVip: true } }),
    db.client.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
  ]);

  return {
    clients: clients.map(toListItem),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats: { total, active, vip, newThisMonth },
  };
}

export async function getClientById(id: string): Promise<ClientDetailDTO | null> {
  const c = await db.client.findUnique({
    where: { id, deletedAt: null },
    include: { assignedTo: { select: { id: true, name: true, image: true } } },
  });
  if (!c) return null;

  const listItem = toListItem({
    ...c,
    gender: c.gender,
    totalSpent: c.totalSpent,
  });

  return {
    ...listItem,
    phoneSecondary: c.phoneSecondary,
    address: c.address,
    region: c.region,
    birthDate: c.birthDate,
    language: c.language,
    preferredChannel: c.preferredChannel,
    sourceDetails: c.sourceDetails,
    notes: c.notes,
    averageBasket: Number(c.averageBasket),
    firstPurchaseAt: c.firstPurchaseAt,
    rfmScore: c.rfmScore,
    rfmRecency: c.rfmRecency,
    rfmFrequency: c.rfmFrequency,
    rfmMonetary: c.rfmMonetary,
    rfmCalculatedAt: c.rfmCalculatedAt,
    acquisitionDate: c.acquisitionDate,
    updatedAt: c.updatedAt,
  };
}

export async function getClientsForExport(
  filters: Partial<ClientFilters>
): Promise<ClientListItemDTO[]> {
  const where = buildWhere(filters);
  const clients = await db.client.findMany({
    where,
    orderBy: { lastName: "asc" },
    take: 10000,
    select: LIST_SELECT,
  });
  return clients.map(toListItem);
}

export async function getClientStats() {
  const [total, active, vip, withPhone, withEmail] = await Promise.all([
    db.client.count({ where: { deletedAt: null } }),
    db.client.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.client.count({ where: { deletedAt: null, isVip: true } }),
    db.client.count({ where: { deletedAt: null, phone: { not: null } } }),
    db.client.count({ where: { deletedAt: null, email: { not: null } } }),
  ]);
  return { total, active, vip, withPhone, withEmail };
}

export async function getAllTags(): Promise<Array<{ tag: string; count: number }>> {
  const result = await db.$queryRaw<Array<{ tag: string; count: bigint }>>`
    SELECT tag, COUNT(*) as count
    FROM clients, unnest(tags) as tag
    WHERE "deletedAt" IS NULL
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 100
  `;
  return result.map((r) => ({ tag: r.tag, count: Number(r.count) }));
}

export async function getClientConsentLogs(clientId: string): Promise<ConsentLogDTO[]> {
  const logs = await db.consentLog.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      channel: true,
      consent: true,
      reason: true,
      source: true,
      createdAt: true,
    },
  });
  return logs as ConsentLogDTO[];
}

export async function getSellers(): Promise<SellerDTO[]> {
  return db.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });
}

export async function getDistinctLocations() {
  const [cities, districts, sources] = await Promise.all([
    db.client.findMany({
      where: { deletedAt: null, city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    db.client.findMany({
      where: { deletedAt: null, district: { not: null } },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
    db.client.findMany({
      where: { deletedAt: null, source: { not: null } },
      select: { source: true },
      distinct: ["source"],
      orderBy: { source: "asc" },
    }),
  ]);

  return {
    cities: cities.map((c) => c.city!).filter(Boolean),
    districts: districts.map((c) => c.district!).filter(Boolean),
    sources: sources.map((c) => c.source!).filter(Boolean),
  };
}
