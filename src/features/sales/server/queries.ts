import "server-only";

import { type SaleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  SaleListItemDTO,
  SaleDetailDTO,
  PaginatedSales,
  SaleStats,
  PaymentMethodType,
} from "../types";
import { PAYMENT_METHOD_LABELS } from "../types";
import type { SaleFilters } from "../schemas/sale.schema";

// ── Types internes ────────────────────────────────────────────────────────────

type SaleRow = {
  id: string;
  reference: string;
  clientId: string | null;
  sellerId: string | null;
  status: string;
  totalAmount: { toNumber(): number } | number;
  paidAmount: { toNumber(): number } | number;
  discountAmount: { toNumber(): number } | number;
  soldAt: Date;
  createdAt: Date;
  client: { firstName: string; lastName: string | null; phone: string | null } | null;
  seller: { name: string } | null;
  _count: { items: number };
  payments: { method: string }[];
};

function toNumber(v: { toNumber(): number } | number): number {
  return typeof v === "number" ? v : v.toNumber();
}

function toListItem(s: SaleRow): SaleListItemDTO {
  const total = toNumber(s.totalAmount);
  const paid = toNumber(s.paidAmount);
  return {
    id: s.id,
    reference: s.reference,
    clientId: s.clientId,
    clientName: s.client
      ? `${s.client.firstName} ${s.client.lastName ?? ""}`.trim()
      : null,
    clientPhone: s.client?.phone ?? null,
    sellerId: s.sellerId,
    sellerName: s.seller?.name ?? null,
    status: s.status as SaleListItemDTO["status"],
    primaryPaymentMethod: (s.payments?.[0]?.method ?? null) as PaymentMethodType | null,
    totalAmount: total,
    paidAmount: paid,
    discountAmount: toNumber(s.discountAmount),
    remainingAmount: Math.max(0, total - paid),
    itemsCount: s._count?.items ?? 0,
    soldAt: s.soldAt,
    createdAt: s.createdAt,
  };
}

const LIST_SELECT = {
  id: true,
  reference: true,
  clientId: true,
  sellerId: true,
  status: true,
  totalAmount: true,
  paidAmount: true,
  discountAmount: true,
  soldAt: true,
  createdAt: true,
  client: { select: { firstName: true, lastName: true, phone: true } },
  seller: { select: { name: true } },
  _count: { select: { items: true } },
  payments: {
    select: { method: true },
    orderBy: { paidAt: "asc" as const },
    take: 1,
  },
} as const;

function buildWhere(
  filters: Partial<SaleFilters>,
  currentUserId: string,
  canReadAll: boolean
) {
  return {
    deletedAt: null,
    ...(!canReadAll && { sellerId: currentUserId }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.sellerId && { sellerId: filters.sellerId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.minAmount !== undefined && {
      totalAmount: { gte: filters.minAmount },
    }),
    ...(filters.maxAmount !== undefined && {
      totalAmount: {
        ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
        lte: filters.maxAmount,
      },
    }),
    ...((filters.dateFrom ?? filters.dateTo) && {
      soldAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
    ...(filters.search && {
      OR: [
        { reference: { contains: filters.search, mode: "insensitive" as const } },
        {
          client: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" as const } },
              { lastName: { contains: filters.search, mode: "insensitive" as const } },
              { phone: { contains: filters.search } },
            ],
          },
        },
      ],
    }),
  };
}

// ── Queries publiques ─────────────────────────────────────────────────────────

export async function getSales(
  filters: SaleFilters,
  currentUserId: string,
  canReadAll: boolean
): Promise<PaginatedSales> {
  const skip = (filters.page - 1) * filters.limit;
  const where = buildWhere(filters, currentUserId, canReadAll);

  const [sales, total, stats] = await Promise.all([
    db.sale.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { [filters.sortBy]: filters.sortDir },
      select: LIST_SELECT,
    }),
    db.sale.count({ where }),
    getSaleStats(where),
  ]);

  return {
    sales: sales.map((s) => toListItem(s as unknown as SaleRow)),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats,
  };
}

export async function getSaleById(
  id: string,
  currentUserId: string,
  canReadAll: boolean
): Promise<SaleDetailDTO | null> {
  const s = await db.sale.findUnique({
    where: {
      id,
      deletedAt: null,
      // Vendeur ne voit que ses propres ventes
      ...(!canReadAll && { sellerId: currentUserId }),
    },
    include: {
      client: { select: { firstName: true, lastName: true, phone: true } },
      seller: { select: { name: true } },
      campaign: { select: { name: true } },
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
      _count: { select: { items: true } },
    },
  });

  if (!s) return null;

  const listItem = toListItem({
    ...s,
    payments: s.payments.slice(0, 1),
  } as unknown as SaleRow);

  return {
    ...listItem,
    discountPercent: s.discountPercent,
    notes: s.notes,
    campaignId: s.campaignId,
    campaignName: s.campaign?.name ?? null,
    items: s.items.map((item) => ({
      id: item.id,
      articleId: item.articleId,
      articleName: item.articleName,
      articleRef: item.articleRef,
      unitPrice: toNumber(item.unitPrice),
      quantity: item.quantity,
      discount: toNumber(item.discount),
      totalPrice: toNumber(item.totalPrice),
    })),
    payments: s.payments.map((p) => ({
      id: p.id,
      method: p.method as PaymentMethodType,
      methodLabel: PAYMENT_METHOD_LABELS[p.method as PaymentMethodType] ?? p.method,
      amount: toNumber(p.amount),
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt,
    })),
  };
}

export async function getSaleStats(
  where: Record<string, unknown> = {}
): Promise<SaleStats> {
  const activeWhere = {
    ...where,
    status: { notIn: ["CANCELLED", "REFUNDED"] as SaleStatus[] },
  };

  const [agg, paidCount, partialCount, unpaidCount, pendingCount, topMethod] =
    await Promise.all([
      db.sale.aggregate({
        where: activeWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
      db.sale.count({ where: { ...where, status: "PAID" } }),
      db.sale.count({ where: { ...where, status: "PARTIAL" } }),
      db.sale.count({ where: { ...where, status: "UNPAID" } }),
      db.sale.count({ where: { ...where, status: "PENDING" } }),
      db.payment.groupBy({
        by: ["method"],
        where: { sale: { deletedAt: null } },
        _count: { method: true },
        orderBy: { _count: { method: "desc" } },
        take: 1,
      }),
    ]);

  return {
    totalRevenue: toNumber(agg._sum?.totalAmount ?? 0),
    totalSales:
      typeof agg._count === "object" && "id" in agg._count
        ? (agg._count.id as number)
        : 0,
    averageBasket: toNumber(agg._avg?.totalAmount ?? 0),
    paidCount,
    partialCount,
    unpaidCount,
    pendingCount,
    topPaymentMethod: (topMethod[0]?.method ?? null) as PaymentMethodType | null,
  };
}

export async function getSalesForExport(
  filters: Partial<SaleFilters>,
  currentUserId: string,
  canReadAll: boolean
): Promise<SaleListItemDTO[]> {
  const where = buildWhere(filters, currentUserId, canReadAll);
  const sales = await db.sale.findMany({
    where,
    orderBy: { soldAt: "desc" },
    take: 10_000,
    select: LIST_SELECT,
  });
  return sales.map((s) => toListItem(s as unknown as SaleRow));
}

export async function generateSaleReference(): Promise<string> {
  const count = await db.sale.count();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `VTE-${year}${month}-${String(count + 1).padStart(4, "0")}`;
}

export async function getTopClients(
  limit = 5,
  dateFrom?: Date
): Promise<
  Array<{ clientId: string; clientName: string; totalSpent: number; salesCount: number }>
> {
  const where = {
    deletedAt: null,
    status: { notIn: ["CANCELLED", "REFUNDED"] as SaleStatus[] },
    clientId: { not: null },
    ...(dateFrom && { soldAt: { gte: dateFrom } }),
  };

  const grouped = await db.sale.groupBy({
    by: ["clientId"],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  const clientIds = grouped.map((g) => g.clientId!).filter(Boolean);
  const clients = await db.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  return grouped.map((g) => {
    const c = clientMap.get(g.clientId!);
    return {
      clientId: g.clientId!,
      clientName: c ? `${c.firstName} ${c.lastName ?? ""}`.trim() : "Client inconnu",
      totalSpent: toNumber(g._sum?.totalAmount ?? 0),
      salesCount:
        typeof g._count === "object" && "id" in g._count ? (g._count.id as number) : 0,
    };
  });
}
