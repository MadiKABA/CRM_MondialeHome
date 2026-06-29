import "server-only";
import { db } from "@/lib/db";
import type {
  EmailBatchDTO,
  MessageLogDTO,
  EmailBatchStatusType,
  MessageStatusType,
} from "../types";
import type { ClientEmailData } from "../lib/personalizer";

// ── Mapper EmailBatch → DTO ───────────────────────────────────────────────────

function toBatchDTO(b: {
  id: string;
  templateId: string;
  segmentId: string | null;
  status: string;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  template: { name: string } | null;
  segment: { name: string } | null;
  createdBy: { name: string } | null;
}): EmailBatchDTO {
  const sent = b.sentCount ?? 0;
  const delivered = b.deliveredCount ?? 0;
  const opened = b.openedCount ?? 0;
  const clicked = b.clickedCount ?? 0;
  const bounced = b.bouncedCount ?? 0;

  const duration =
    b.startedAt && b.completedAt
      ? Math.round(
          (new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime()) / 1000
        )
      : null;

  return {
    id: b.id,
    templateId: b.templateId,
    templateName: b.template?.name ?? "—",
    segmentId: b.segmentId,
    segmentName: b.segment?.name ?? null,
    status: b.status as EmailBatchStatusType,
    totalCount: b.totalCount,
    sentCount: sent,
    deliveredCount: delivered,
    openedCount: opened,
    bouncedCount: bounced,
    failedCount: b.failedCount ?? 0,
    clickedCount: clicked,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
    bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
    startedAt: b.startedAt,
    completedAt: b.completedAt,
    duration,
    createdAt: b.createdAt,
    createdByName: b.createdBy?.name ?? null,
  };
}

const BATCH_SELECT = {
  id: true,
  templateId: true,
  segmentId: true,
  status: true,
  totalCount: true,
  sentCount: true,
  deliveredCount: true,
  openedCount: true,
  clickedCount: true,
  bouncedCount: true,
  failedCount: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  template: { select: { name: true } },
  segment: { select: { name: true } },
  createdBy: { select: { name: true } },
} as const;

// ── Liste des batches ─────────────────────────────────────────────────────────

export async function getEmailBatches(
  page = 1,
  limit = 20
): Promise<{ batches: EmailBatchDTO[]; total: number }> {
  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    db.emailBatch.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: BATCH_SELECT,
    }),
    db.emailBatch.count(),
  ]);

  return { batches: batches.map(toBatchDTO), total };
}

// ── Détail d'un batch ─────────────────────────────────────────────────────────

export async function getEmailBatchById(id: string): Promise<EmailBatchDTO | null> {
  const batch = await db.emailBatch.findUnique({
    where: { id },
    select: BATCH_SELECT,
  });
  return batch ? toBatchDTO(batch) : null;
}

// ── Messages d'un batch (paginés) ────────────────────────────────────────────

export async function getBatchMessages(
  batchId: string,
  page = 1,
  limit = 50
): Promise<{ messages: MessageLogDTO[]; total: number }> {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    db.messageLog.findMany({
      where: { batchId },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        clientId: true,
        status: true,
        resendId: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        bouncedAt: true,
        errorMessage: true,
        createdAt: true,
        client: { select: { firstName: true, lastName: true } },
      },
    }),
    db.messageLog.count({ where: { batchId } }),
  ]);

  return {
    messages: messages.map((m) => ({
      id: m.id,
      email: m.email,
      clientId: m.clientId,
      clientName: m.client
        ? `${m.client.firstName} ${m.client.lastName ?? ""}`.trim()
        : null,
      status: m.status as MessageStatusType,
      resendId: m.resendId,
      sentAt: m.sentAt,
      deliveredAt: m.deliveredAt,
      openedAt: m.openedAt,
      clickedAt: m.clickedAt,
      bouncedAt: m.bouncedAt,
      errorMessage: m.errorMessage,
      createdAt: m.createdAt,
    })),
    total,
  };
}

// ── Clients éligibles d'un segment ───────────────────────────────────────────

export async function getEligibleClientsForEmail(
  segmentId: string
): Promise<ClientEmailData[]> {
  const members = await db.segmentMember.findMany({
    where: { segmentId },
    select: { clientId: true },
  });

  if (members.length === 0) return [];

  const clientIds = members.map((m) => m.clientId);

  const clients = await db.client.findMany({
    where: {
      id: { in: clientIds },
      deletedAt: null,
      status: { notIn: ["BLACKLISTED", "UNSUBSCRIBED"] },
      emailConsent: true,
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      city: true,
      district: true,
      totalSpent: true,
      totalOrders: true,
      lastPurchaseAt: true,
      emailConsent: true,
    },
  });

  return clients
    .filter((c) => c.email)
    .map((c) => ({
      id: c.id,
      email: c.email!,
      firstName: c.firstName,
      lastName: c.lastName,
      city: c.city,
      district: c.district,
      totalSpent: Number(c.totalSpent ?? 0),
      totalOrders: c.totalOrders ?? 0,
      lastPurchaseAt: c.lastPurchaseAt,
      emailConsent: c.emailConsent,
    }));
}

// ── Stats globales email ──────────────────────────────────────────────────────

export async function getEmailGlobalStats(): Promise<{
  totalBatches: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  avgOpenRate: number;
  avgDeliveryRate: number;
}> {
  const totals = await db.emailBatch.aggregate({
    where: { status: "COMPLETED" },
    _sum: { sentCount: true, deliveredCount: true, openedCount: true },
    _count: { id: true },
  });

  const totalSent = totals._sum.sentCount ?? 0;
  const totalDelivered = totals._sum.deliveredCount ?? 0;
  const totalOpened = totals._sum.openedCount ?? 0;

  return {
    totalBatches: totals._count.id,
    totalSent,
    totalDelivered,
    totalOpened,
    avgDeliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    avgOpenRate:
      totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
  };
}
