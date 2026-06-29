import "server-only";

import { db } from "@/lib/db";

export interface ClientRFMData {
  clientId: string;
  lastPurchaseAt: Date | null;
  ordersLast12Months: number;
  revenueLast12Months: number;
}

function twelveMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d;
}

export async function getClientRFMData(clientId: string): Promise<ClientRFMData | null> {
  const client = await db.client.findUnique({
    where: { id: clientId, deletedAt: null },
    select: { id: true, lastPurchaseAt: true },
  });
  if (!client) return null;

  const agg = await db.sale.aggregate({
    where: {
      clientId,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      soldAt: { gte: twelveMonthsAgo() },
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  return {
    clientId,
    lastPurchaseAt: client.lastPurchaseAt,
    ordersLast12Months: agg._count.id,
    revenueLast12Months: Number(agg._sum.totalAmount ?? 0),
  };
}

export async function* getAllClientsRFMData(
  batchSize = 500
): AsyncGenerator<ClientRFMData[]> {
  let skip = 0;
  const cutoff = twelveMonthsAgo();

  while (true) {
    const clients = await db.client.findMany({
      where: { deletedAt: null, status: { not: "BLACKLISTED" } },
      select: { id: true, lastPurchaseAt: true },
      skip,
      take: batchSize,
      orderBy: { id: "asc" },
    });

    if (clients.length === 0) break;

    const clientIds = clients.map((c) => c.id);

    const salesAgg = await db.sale.groupBy({
      by: ["clientId"],
      where: {
        clientId: { in: clientIds },
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        soldAt: { gte: cutoff },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const salesMap = new Map(
      salesAgg.map((s) => [
        s.clientId,
        { orders: s._count.id, revenue: Number(s._sum.totalAmount ?? 0) },
      ])
    );

    const batch: ClientRFMData[] = clients.map((c) => {
      const sales = salesMap.get(c.id);
      return {
        clientId: c.id,
        lastPurchaseAt: c.lastPurchaseAt,
        ordersLast12Months: sales?.orders ?? 0,
        revenueLast12Months: sales?.revenue ?? 0,
      };
    });

    yield batch;

    if (clients.length < batchSize) break;
    skip += batchSize;
  }
}

export async function getRFMStats(): Promise<{
  byProfile: Record<string, number>;
  total: number;
  calculatedCount: number;
  lastRunAt: Date | null;
}> {
  const [byProfile, total, calculatedCount, lastCalculated] = await Promise.all([
    db.client.groupBy({
      by: ["rfmScore"],
      where: { deletedAt: null, rfmScore: { not: null } },
      _count: { id: true },
    }),
    db.client.count({ where: { deletedAt: null } }),
    db.client.count({ where: { deletedAt: null, rfmScore: { not: null } } }),
    db.client.findFirst({
      where: { rfmCalculatedAt: { not: null } },
      orderBy: { rfmCalculatedAt: "desc" },
      select: { rfmCalculatedAt: true },
    }),
  ]);

  const profileMap: Record<string, number> = {};
  for (const row of byProfile) {
    if (row.rfmScore) profileMap[row.rfmScore] = row._count.id;
  }

  return {
    byProfile: profileMap,
    total,
    calculatedCount,
    lastRunAt: lastCalculated?.rfmCalculatedAt ?? null,
  };
}
