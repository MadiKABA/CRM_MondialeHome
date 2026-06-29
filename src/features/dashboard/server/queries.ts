import "server-only";
import type { Prisma, SaleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCached, CACHE_KEYS, CACHE_TTL } from "../lib/cache";
import {
  resolvePeriod,
  PAYMENT_METHOD_LABELS,
  type Period,
  type DashboardKPIs,
  type RevenueChartData,
  type RevenueDataPoint,
  type TopClient,
  type TopArticle,
  type PaymentMethodStat,
  type CityStat,
  type RFMDashboardStats,
  type SegmentStat,
  type DashboardAlert,
} from "../types";

// ── Clause WHERE commune pour les ventes ──────────────────────────────────────

const EXCLUDED_STATUSES: SaleStatus[] = ["CANCELLED", "REFUNDED"];

function buildSaleWhere(
  range: { from: Date; to: Date },
  extraWhere?: Prisma.SaleWhereInput
): Prisma.SaleWhereInput {
  return {
    deletedAt: null,
    status: { notIn: EXCLUDED_STATUSES },
    soldAt: { gte: range.from, lte: range.to },
    ...extraWhere,
  };
}

function getPreviousPeriod(range: { from: Date; to: Date }): {
  from: Date;
  to: Date;
} {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.to.getTime() - duration),
  };
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export async function getDashboardKPIs(period: Period): Promise<DashboardKPIs> {
  return getCached(
    CACHE_KEYS.kpis(period),
    async () => {
      const range = resolvePeriod(period);
      const prevRange = getPreviousPeriod(range);

      const [
        currentSales,
        previousSales,
        paidSales,
        pendingSales,
        totalClients,
        newClients,
        activeClients,
        previousClients,
      ] = await Promise.all([
        db.sale.aggregate({
          where: buildSaleWhere(range),
          _sum: { totalAmount: true },
          _count: true,
          _avg: { totalAmount: true },
        }),
        db.sale.aggregate({
          where: buildSaleWhere(prevRange),
          _sum: { totalAmount: true },
          _count: true,
        }),
        db.sale.aggregate({
          where: { ...buildSaleWhere(range), status: "PAID" },
          _sum: { totalAmount: true },
        }),
        db.sale.aggregate({
          where: {
            deletedAt: null,
            status: { in: ["PARTIAL", "UNPAID"] },
            soldAt: { gte: range.from, lte: range.to },
          },
          _sum: { paidAmount: true },
          _count: true,
        }),
        db.client.count({
          where: { deletedAt: null, status: { not: "BLACKLISTED" } },
        }),
        db.client.count({
          where: {
            deletedAt: null,
            createdAt: { gte: range.from, lte: range.to },
          },
        }),
        db.sale.groupBy({
          by: ["clientId"],
          where: { ...buildSaleWhere(range), clientId: { not: null } },
          _count: { _all: true },
        }),
        db.client.count({
          where: {
            deletedAt: null,
            createdAt: { gte: prevRange.from, lte: prevRange.to },
          },
        }),
      ]);

      const currentRevenue = Number(currentSales._sum?.totalAmount ?? 0);
      const previousRevenue = Number(previousSales._sum?.totalAmount ?? 0);
      const currentCount = currentSales._count as number;
      const previousCount = previousSales._count as number;

      const revenueGrowth =
        previousRevenue > 0
          ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
          : 0;

      const salesGrowth =
        previousCount > 0
          ? Math.round(((currentCount - previousCount) / previousCount) * 100)
          : 0;

      const clientGrowth =
        previousClients > 0
          ? Math.round(((newClients - previousClients) / previousClients) * 100)
          : 0;

      return {
        totalRevenue: currentRevenue,
        totalSales: currentCount,
        averageBasket: Number(currentSales._avg?.totalAmount ?? 0),
        paidRevenue: Number(paidSales._sum?.totalAmount ?? 0),
        pendingRevenue: Number(pendingSales._sum?.paidAmount ?? 0),
        revenueGrowth,
        salesGrowth,
        totalClients,
        newClients,
        activeClients: activeClients.length,
        clientGrowth,
        computedAt: new Date(),
        period,
      } satisfies DashboardKPIs;
    },
    CACHE_TTL.kpis
  );
}

// ── Courbe CA ─────────────────────────────────────────────────────────────────

export async function getRevenueChart(period: Period): Promise<RevenueChartData> {
  return getCached(
    CACHE_KEYS.revenueChart(period),
    async () => {
      const range = resolvePeriod(period);

      const durationDays = Math.round(
        (range.to.getTime() - range.from.getTime()) / 86_400_000
      );
      const granularity: "day" | "week" | "month" =
        durationDays <= 31 ? "day" : durationDays <= 90 ? "week" : "month";

      const sales = await db.sale.findMany({
        where: buildSaleWhere(range),
        select: {
          soldAt: true,
          totalAmount: true,
        },
        orderBy: { soldAt: "asc" },
      });

      const grouped = new Map<string, { revenue: number; count: number }>();

      for (const sale of sales) {
        const key = formatDateKey(sale.soldAt, granularity);
        const existing = grouped.get(key) ?? { revenue: 0, count: 0 };
        grouped.set(key, {
          revenue: existing.revenue + Number(sale.totalAmount),
          count: existing.count + 1,
        });
      }

      const points: RevenueDataPoint[] = Array.from(grouped.entries())
        .map(([dateKey, data]) => ({
          date: dateKey,
          revenue: Math.round(data.revenue),
          salesCount: data.count,
          label: formatDateLabel(dateKey, granularity),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const total = points.reduce((sum, p) => sum + p.revenue, 0);

      return {
        points,
        total: Math.round(total),
        period,
        granularity,
      } satisfies RevenueChartData;
    },
    CACHE_TTL.revenueChart
  );
}

function formatDateKey(date: Date, granularity: "day" | "week" | "month"): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  if (granularity === "month") return `${y}-${m}`;

  if (granularity === "week") {
    const startOfYear = new Date(y, 0, 1);
    const week = Math.ceil(
      ((date.getTime() - startOfYear.getTime()) / 86_400_000 + startOfYear.getDay() + 1) /
        7
    );
    return `${y}-W${String(week).padStart(2, "0")}`;
  }

  return `${y}-${m}-${d}`;
}

function formatDateLabel(key: string, granularity: "day" | "week" | "month"): string {
  if (granularity === "month") {
    const [y, mo] = key.split("-");
    return new Date(parseInt(y!), parseInt(mo!) - 1, 1).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
  }

  if (granularity === "week") {
    return `Sem. ${key.split("-W")[1]}`;
  }

  return new Date(key).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// ── Top clients ───────────────────────────────────────────────────────────────

export async function getTopClients(
  period: Period,
  limit: number = 5
): Promise<TopClient[]> {
  return getCached(
    CACHE_KEYS.topClients(period),
    async () => {
      const range = resolvePeriod(period);

      const salesByClient = await db.sale.groupBy({
        by: ["clientId"],
        where: {
          ...buildSaleWhere(range),
          clientId: { not: null },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: limit,
      });

      if (salesByClient.length === 0) return [];

      const clientIds = salesByClient.map((s) => s.clientId).filter(Boolean) as string[];

      const clients = await db.client.findMany({
        where: { id: { in: clientIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          rfmScore: true,
          lastPurchaseAt: true,
        },
      });

      const clientMap = new Map(clients.map((c) => [c.id, c]));

      return salesByClient
        .map((s) => {
          const client = clientMap.get(s.clientId!);
          if (!client) return null;
          return {
            clientId: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone,
            city: client.city,
            rfmScore: client.rfmScore,
            totalSpent: Number(s._sum?.totalAmount ?? 0),
            totalOrders: (s._count as { _all: number })._all,
            lastPurchaseAt: client.lastPurchaseAt,
          } satisfies TopClient;
        })
        .filter(Boolean) as TopClient[];
    },
    CACHE_TTL.topClients
  );
}

// ── Top articles ──────────────────────────────────────────────────────────────

export async function getTopArticles(
  period: Period,
  limit: number = 5
): Promise<TopArticle[]> {
  return getCached(
    CACHE_KEYS.topArticles(period),
    async () => {
      const range = resolvePeriod(period);

      const itemsByArticle = await db.saleItem.groupBy({
        by: ["articleId", "articleName", "articleRef"],
        where: {
          sale: {
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            soldAt: { gte: range.from, lte: range.to },
          },
          articleId: { not: null },
        },
        _sum: { totalPrice: true, quantity: true },
        _count: { _all: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: limit,
      });

      if (itemsByArticle.length === 0) return [];

      const articleIds = itemsByArticle
        .map((i) => i.articleId)
        .filter(Boolean) as string[];

      const articles = await db.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, mainImage: true },
      });

      const imageMap = new Map(articles.map((a) => [a.id, a.mainImage]));

      return itemsByArticle.map(
        (item) =>
          ({
            articleId: item.articleId!,
            articleName: item.articleName,
            articleRef: item.articleRef,
            mainImage: imageMap.get(item.articleId!) ?? null,
            quantitySold: Number(item._sum?.quantity ?? 0),
            revenue: Number(item._sum?.totalPrice ?? 0),
            salesCount: (item._count as { _all: number })._all,
          }) satisfies TopArticle
      );
    },
    CACHE_TTL.topArticles
  );
}

// ── Répartition paiements ─────────────────────────────────────────────────────

export async function getPaymentMethodStats(
  period: Period
): Promise<PaymentMethodStat[]> {
  return getCached(
    CACHE_KEYS.paymentMethods(period),
    async () => {
      const range = resolvePeriod(period);

      const payments = await db.payment.groupBy({
        by: ["method"],
        where: {
          sale: {
            deletedAt: null,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            soldAt: { gte: range.from, lte: range.to },
          },
        },
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: "desc" } },
      });

      const totalAmount = payments.reduce(
        (sum, p) => sum + Number(p._sum?.amount ?? 0),
        0
      );

      return payments.map(
        (p) =>
          ({
            method: p.method,
            methodLabel: PAYMENT_METHOD_LABELS[p.method] ?? p.method,
            amount: Number(p._sum?.amount ?? 0),
            count: (p._count as { _all: number })._all,
            percentage:
              totalAmount > 0
                ? Math.round((Number(p._sum?.amount ?? 0) / totalAmount) * 100)
                : 0,
          }) satisfies PaymentMethodStat
      );
    },
    CACHE_TTL.paymentMethods
  );
}

// ── Répartition géographique ──────────────────────────────────────────────────

export async function getCityStats(limit: number = 8): Promise<CityStat[]> {
  return getCached(
    CACHE_KEYS.cities(),
    async () => {
      const [citiesRaw, totalClients] = await Promise.all([
        db.client.groupBy({
          by: ["city"],
          where: { deletedAt: null, city: { not: null } },
          _count: { id: true },
          _sum: { totalSpent: true },
          orderBy: { _count: { id: "desc" } },
          take: limit,
        }),
        db.client.count({ where: { deletedAt: null } }),
      ]);

      return citiesRaw
        .filter((c) => c.city)
        .map(
          (c) =>
            ({
              city: c.city!,
              clientCount: c._count.id,
              revenue: Number(c._sum?.totalSpent ?? 0),
              percentage:
                totalClients > 0 ? Math.round((c._count.id / totalClients) * 100) : 0,
            }) satisfies CityStat
        );
    },
    CACHE_TTL.cities
  );
}

// ── Stats RFM ─────────────────────────────────────────────────────────────────

export async function getRFMStats(): Promise<RFMDashboardStats> {
  return getCached(
    CACHE_KEYS.rfmStats(),
    async () => {
      const [byProfile, total, scoredCount, lastRun] = await Promise.all([
        db.client.groupBy({
          by: ["rfmScore"],
          where: { deletedAt: null, rfmScore: { not: null } },
          _count: { id: true },
        }),
        db.client.count({ where: { deletedAt: null } }),
        db.client.count({
          where: { deletedAt: null, rfmScore: { not: null } },
        }),
        db.setting.findUnique({ where: { key: "rfm_last_run" } }),
      ]);

      let lastRunAt: Date | null = null;
      if (lastRun?.value) {
        try {
          const parsed = JSON.parse(lastRun.value as string) as { runAt?: string };
          lastRunAt = parsed.runAt ? new Date(parsed.runAt) : null;
        } catch {
          /* ignore */
        }
      }

      const profileMap: Record<string, number> = {};
      for (const row of byProfile) {
        if (row.rfmScore) profileMap[row.rfmScore] = row._count.id;
      }

      return {
        byProfile: profileMap,
        total,
        scoredCount,
        unscoredCount: total - scoredCount,
        lastRunAt,
      } satisfies RFMDashboardStats;
    },
    CACHE_TTL.rfmStats
  );
}

// ── Top segments ──────────────────────────────────────────────────────────────

export async function getTopSegments(limit: number = 6): Promise<SegmentStat[]> {
  return getCached(
    CACHE_KEYS.segments(),
    async () => {
      const segments = await db.segment.findMany({
        where: { isActive: true },
        orderBy: [{ memberCount: "desc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          memberCount: true,
          color: true,
          icon: true,
        },
      });

      return segments.map(
        (s) =>
          ({
            id: s.id,
            name: s.name,
            type: s.type,
            memberCount: s.memberCount,
            color: s.color ?? "#8B6914",
            icon: s.icon,
          }) satisfies SegmentStat
      );
    },
    CACHE_TTL.segments
  );
}

// ── Alertes intelligentes ─────────────────────────────────────────────────────

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];

  try {
    const [unpaidSales, unscoredClients, atRiskClients, rfmLastRun] = await Promise.all([
      db.sale.count({
        where: { deletedAt: null, status: "UNPAID" },
      }),
      db.client.count({
        where: { deletedAt: null, rfmScore: null },
      }),
      db.client.count({
        where: { deletedAt: null, rfmScore: "at_risk" },
      }),
      db.setting.findUnique({ where: { key: "rfm_last_run" } }),
    ]);

    if (unpaidSales > 0) {
      alerts.push({
        type: "warning",
        title: `${unpaidSales} vente(s) impayée(s)`,
        message: "Des ventes n'ont pas encore été réglées",
        action: { label: "Voir les ventes", href: "/sales?status=UNPAID" },
      });
    }

    if (atRiskClients > 0) {
      alerts.push({
        type: "warning",
        title: `${atRiskClients} client(s) à risque`,
        message: "Ces clients n'ont pas acheté depuis plus de 90 jours",
        action: { label: "Voir le segment", href: "/segments" },
      });
    }

    if (unscoredClients > 0) {
      alerts.push({
        type: "info",
        title: `${unscoredClients} client(s) sans score RFM`,
        message: "Le score RFM n'a pas encore été calculé pour ces clients",
      });
    }

    if (rfmLastRun?.value) {
      try {
        const parsed = JSON.parse(rfmLastRun.value as string) as { runAt?: string };
        if (parsed.runAt) {
          const lastRun = new Date(parsed.runAt);
          const ageHours = (Date.now() - lastRun.getTime()) / 3_600_000;

          if (ageHours > 48) {
            alerts.push({
              type: "warning",
              title: "Score RFM obsolète",
              message: `Dernier calcul il y a ${Math.round(ageHours / 24)} jours`,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    // Les alertes ne font jamais planter le dashboard
  }

  return alerts;
}

// ── Données complètes du dashboard ────────────────────────────────────────────

export async function getFullDashboardData(period: Period = "month"): Promise<{
  kpis: DashboardKPIs;
  revenueChart: RevenueChartData;
  topClients: TopClient[];
  topArticles: TopArticle[];
  paymentMethods: PaymentMethodStat[];
  cities: CityStat[];
  rfmStats: RFMDashboardStats;
  topSegments: SegmentStat[];
  alerts: DashboardAlert[];
}> {
  const [
    kpis,
    revenueChart,
    topClients,
    topArticles,
    paymentMethods,
    cities,
    rfmStats,
    topSegments,
    alerts,
  ] = await Promise.all([
    getDashboardKPIs(period),
    getRevenueChart(period),
    getTopClients(period),
    getTopArticles(period),
    getPaymentMethodStats(period),
    getCityStats(),
    getRFMStats(),
    getTopSegments(),
    getDashboardAlerts(),
  ]);

  return {
    kpis,
    revenueChart,
    topClients,
    topArticles,
    paymentMethods,
    cities,
    rfmStats,
    topSegments,
    alerts,
  };
}
