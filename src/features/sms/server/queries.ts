import { type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAllSegments } from "@/features/segments/server/queries";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { maskPhoneNumber } from "@/lib/sms/validator";
import type { CampaignStatus } from "@/features/campaigns/types";
import type { SmsCampaignFilters } from "../schemas/sms.schema";
import type {
  SmsCampaignData,
  SmsCampaignDTO,
  SmsCampaignStats,
  SmsRecipientDTO,
  SmsSegmentDTO,
  PaginatedSmsCampaigns,
} from "../types";

export interface SmsClientData {
  id: string;
  phone: string;
  firstName: string;
}

// ── Segments avec nombre de clients réellement éligibles au SMS ───────────────
// Un client est éligible si smsConsent = true ET s'il a un numéro de téléphone.

export async function getSegmentsWithSmsEligibility(): Promise<SmsSegmentDTO[]> {
  const { segments, groups } = await getAllSegments();
  const all = [...segments, ...groups];

  const eligibleCounts = await db.segmentMember.groupBy({
    by: ["segmentId"],
    where: { client: { smsConsent: true, phone: { not: null } } },
    _count: { _all: true },
  });
  const eligibleBySegment = new Map(
    eligibleCounts.map((e) => [e.segmentId, e._count._all])
  );

  return all.map((s) => ({ ...s, smsEligibleCount: eligibleBySegment.get(s.id) ?? 0 }));
}

// ── Clients éligibles d'un segment (consentement + numéro requis) ─────────────

export async function getEligibleClientsForSms(
  segmentId: string
): Promise<SmsClientData[]> {
  const members = await db.segmentMember.findMany({
    where: { segmentId },
    select: { clientId: true },
  });

  if (members.length === 0) return [];

  const clients = await db.client.findMany({
    where: {
      id: { in: members.map((m) => m.clientId) },
      deletedAt: null,
      status: { notIn: ["BLACKLISTED", "UNSUBSCRIBED"] },
      smsConsent: true,
      phone: { not: null },
    },
    select: { id: true, phone: true, firstName: true },
  });

  return clients
    .filter((c): c is { id: string; phone: string; firstName: string } => !!c.phone)
    .map((c) => ({ id: c.id, phone: c.phone, firstName: c.firstName }));
}

// ── Campagnes SMS planifiées dont l'heure est arrivée ──────────────────────────

export async function getDueSmsCampaigns(): Promise<
  Array<{ id: string; name: string; createdById: string }>
> {
  return db.campaign.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      scheduledAt: { lte: new Date() },
      channels: { has: "SMS" },
    },
    select: { id: true, name: true, createdById: true },
    take: 10,
  });
}

// ── Campagne SMS prête à être envoyée (segment + variant + variables) ─────────

export async function getSmsCampaignForSend(campaignId: string) {
  return db.campaign.findUnique({
    where: { id: campaignId, deletedAt: null },
    select: {
      id: true,
      status: true,
      channels: true,
      segmentId: true,
      smsCampaignData: true,
      variants: {
        where: { channel: "SMS" },
        select: { id: true },
        take: 1,
      },
    },
  });
}

// ── Stats d'une campagne SMS (calculées depuis Message) ───────────────────────

export async function getSmsCampaignStats(campaignId: string): Promise<SmsCampaignStats> {
  const [total, sent, delivered, failed, costAgg] = await Promise.all([
    db.message.count({ where: { campaignId, channel: "SMS" } }),
    db.message.count({
      where: { campaignId, channel: "SMS", status: { in: ["SENT", "DELIVERED"] } },
    }),
    db.message.count({ where: { campaignId, channel: "SMS", status: "DELIVERED" } }),
    db.message.count({ where: { campaignId, channel: "SMS", status: "FAILED" } }),
    db.message.aggregate({
      where: { campaignId, channel: "SMS" },
      _sum: { cost: true },
    }),
  ]);

  return {
    total,
    sent,
    delivered,
    failed,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    costActual: Number(costAgg._sum.cost ?? 0),
  };
}

// ── Liste paginée des campagnes SMS ────────────────────────────────────────────

const SMS_CAMPAIGN_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  scheduledAt: true,
  sentAt: true,
  createdAt: true,
  totalRecipients: true,
  totalSent: true,
  totalDelivered: true,
  totalFailed: true,
  deliveryRate: true,
  actualCost: true,
  segment: { select: { name: true, memberCount: true } },
  variants: {
    where: { channel: "SMS" as const },
    select: { content: true },
    take: 1,
  },
} as const;

type SmsCampaignQueryResult = Prisma.CampaignGetPayload<{
  select: typeof SMS_CAMPAIGN_SELECT;
}>;

function toSmsCampaignDTO(c: SmsCampaignQueryResult): SmsCampaignDTO {
  const message = c.variants[0]?.content ?? "";
  const costPerClient = analyzeMessage(message).costPerClient;
  const recipientCount = c.totalRecipients || c.segment?.memberCount || 0;

  return {
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status as CampaignStatus,
    segmentName: c.segment?.name ?? "—",
    segmentCount: c.segment?.memberCount ?? 0,
    message,
    scheduledAt: c.scheduledAt,
    sentAt: c.sentAt,
    createdAt: c.createdAt,
    totalRecipients: c.totalRecipients,
    totalSent: c.totalSent,
    totalDelivered: c.totalDelivered,
    totalFailed: c.totalFailed,
    deliveryRate: c.deliveryRate ?? 0,
    costEstimated: costPerClient * recipientCount,
    costActual: Number(c.actualCost ?? 0),
  };
}

export async function getSmsCampaigns(
  filters: SmsCampaignFilters
): Promise<PaginatedSmsCampaigns> {
  const skip = (filters.page - 1) * filters.limit;

  const where = {
    deletedAt: null,
    channels: { has: "SMS" },
    ...(filters.status && { status: filters.status as CampaignStatus }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  const [campaigns, total, statusGroups] = await Promise.all([
    db.campaign.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [{ createdAt: "desc" }],
      select: SMS_CAMPAIGN_SELECT,
    }),
    db.campaign.count({ where }),
    db.campaign.groupBy({
      by: ["status"],
      where: { deletedAt: null, channels: { has: "SMS" } },
      _count: { id: true },
    }),
  ]);

  const byStatus: Partial<Record<CampaignStatus, number>> = {};
  for (const row of statusGroups) {
    byStatus[row.status as CampaignStatus] = row._count.id;
  }

  return {
    campaigns: campaigns.map(toSmsCampaignDTO),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats: { total, byStatus },
  };
}

// ── Détail d'une campagne SMS ──────────────────────────────────────────────────

export async function getSmsCampaignById(id: string): Promise<SmsCampaignDTO | null> {
  const campaign = await db.campaign.findFirst({
    where: { id, deletedAt: null, channels: { has: "SMS" } },
    select: SMS_CAMPAIGN_SELECT,
  });
  return campaign ? toSmsCampaignDTO(campaign) : null;
}

// ── Destinataires individuels d'une campagne SMS ──────────────────────────────

const RECIPIENTS_PAGE_SIZE = 50;

export async function getSmsCampaignRecipients(
  campaignId: string,
  page = 1,
  status?: string
): Promise<{
  recipients: SmsRecipientDTO[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const where = {
    campaignId,
    channel: "SMS",
    ...(status && { status: status as Prisma.MessageWhereInput["status"] }),
  };

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * RECIPIENTS_PAGE_SIZE,
      take: RECIPIENTS_PAGE_SIZE,
      select: {
        id: true,
        recipient: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        errorMessage: true,
        client: { select: { firstName: true, lastName: true } },
      },
    }),
    db.message.count({ where }),
  ]);

  return {
    recipients: messages.map((m) => ({
      id: m.id,
      clientName: m.client
        ? `${m.client.firstName} ${m.client.lastName ?? ""}`.trim()
        : null,
      phone: maskPhoneNumber(m.recipient),
      status: m.status,
      sentAt: m.sentAt,
      deliveredAt: m.deliveredAt,
      errorMessage: m.errorMessage,
    })),
    total,
    page,
    totalPages: Math.ceil(total / RECIPIENTS_PAGE_SIZE),
  };
}

export function parseSmsCampaignData(value: unknown): SmsCampaignData {
  if (value && typeof value === "object") {
    const v = value as Partial<SmsCampaignData>;
    return { produit: v.produit ?? null, reduction: v.reduction ?? null };
  }
  return { produit: null, reduction: null };
}
