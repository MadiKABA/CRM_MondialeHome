import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  CampaignDTO,
  CampaignGlobalStats,
  CampaignStatus,
  PaginatedCampaigns,
} from "../types";
import type { CampaignFilters } from "../schemas/campaign.schema";
import { recomputeBatchStats } from "../lib/stats";
import { computeRates, isTrackingPending } from "../lib/stats-math";
import type { EmailCampaignData } from "@/features/email-mass/types";

// ── Select partagé ────────────────────────────────────────────────────────────

const CAMPAIGN_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  segmentId: true,
  templateId: true,
  campaignData: true,
  scheduledAt: true,
  sentAt: true,
  completedAt: true,
  totalRecipients: true,
  totalSent: true,
  totalDelivered: true,
  totalOpened: true,
  totalClicked: true,
  totalFailed: true,
  totalBounced: true,
  totalUnsubscribed: true,
  deliveryRate: true,
  openRate: true,
  clickRate: true,
  bounceRate: true,
  emailBatchId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  segment: { select: { name: true, memberCount: true } },
  template: { select: { name: true } },
  createdBy: { select: { name: true } },
} as const;

// ── Type du résultat de la requête Prisma ────────────────────────────────────

type CampaignQueryResult = Prisma.CampaignGetPayload<{
  select: typeof CAMPAIGN_SELECT;
}>;

// ── Mapper Prisma → DTO ───────────────────────────────────────────────────────

function toDTO(c: CampaignQueryResult): CampaignDTO {
  const counts = {
    sent: c.totalSent ?? 0,
    delivered: c.totalDelivered ?? 0,
    opened: c.totalOpened ?? 0,
    clicked: c.totalClicked ?? 0,
    bounced: c.totalBounced ?? 0,
    failed: c.totalFailed ?? 0,
  };
  const rates = computeRates(counts);

  return {
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status as CampaignStatus,
    segmentId: c.segmentId,
    segmentName: c.segment?.name ?? "—",
    segmentCount: c.segment?.memberCount ?? 0,
    templateId: c.templateId,
    templateName: c.template?.name ?? null,
    campaignData: c.campaignData as EmailCampaignData | null,
    scheduledAt: c.scheduledAt,
    sentAt: c.sentAt,
    completedAt: c.completedAt,
    totalCount: c.totalRecipients ?? 0,
    sentCount: counts.sent,
    deliveredCount: counts.delivered,
    openedCount: counts.opened,
    clickedCount: counts.clicked,
    bouncedCount: counts.bounced,
    failedCount: counts.failed,
    unsubscribedCount: c.totalUnsubscribed ?? 0,
    deliveryRate: rates.deliveryRate,
    openRate: rates.openRate,
    clickRate: rates.clickRate,
    bounceRate: rates.bounceRate,
    trackingPending: isTrackingPending(counts),
    emailBatchId: c.emailBatchId,
    createdById: c.createdById,
    createdByName: c.createdBy?.name ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── Liste paginée ─────────────────────────────────────────────────────────────

export async function getCampaigns(
  filters: CampaignFilters
): Promise<PaginatedCampaigns> {
  const skip = (filters.page - 1) * filters.limit;

  const where: Prisma.CampaignWhereInput = {
    deletedAt: null,
    ...(filters.status && {
      status: filters.status as Prisma.EnumCampaignStatusFilter,
    }),
    ...(filters.segmentId && { segmentId: filters.segmentId }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [campaigns, total, statusGroups] = await Promise.all([
    db.campaign.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [{ createdAt: "desc" }],
      select: CAMPAIGN_SELECT,
    }),
    db.campaign.count({ where }),
    db.campaign.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const byStatus: Partial<Record<CampaignStatus, number>> = {};
  for (const row of statusGroups) {
    byStatus[row.status as CampaignStatus] = row._count.id;
  }

  const sentAgg = await db.campaign.aggregate({
    where: { deletedAt: null, status: { in: ["SENT", "COMPLETED"] } },
    _sum: {
      totalSent: true,
      totalDelivered: true,
      totalOpened: true,
      totalClicked: true,
    },
    _max: { sentAt: true },
  });

  const totalSentCount = sentAgg._sum.totalSent ?? 0;
  const totalDelivered = sentAgg._sum.totalDelivered ?? 0;
  const totalOpened = sentAgg._sum.totalOpened ?? 0;
  const totalClicked = sentAgg._sum.totalClicked ?? 0;

  const stats: CampaignGlobalStats = {
    total: await db.campaign.count({ where: { deletedAt: null } }),
    byStatus,
    totalSent: totalSentCount,
    avgOpenRate:
      totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
    avgClickRate:
      totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100) : 0,
    avgDeliveryRate:
      totalSentCount > 0 ? Math.round((totalDelivered / totalSentCount) * 100) : 0,
    lastCampaignAt: sentAgg._max.sentAt,
  };

  return {
    campaigns: campaigns.map(toDTO),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats,
  };
}

// ── Détail d'une campagne ─────────────────────────────────────────────────────

export async function getCampaignById(id: string): Promise<CampaignDTO | null> {
  const campaign = await db.campaign.findUnique({
    where: { id, deletedAt: null },
    select: CAMPAIGN_SELECT,
  });
  return campaign ? toDTO(campaign) : null;
}

// ── Vérifier l'unicité du nom ─────────────────────────────────────────────────

export async function isCampaignNameUnique(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await db.campaign.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
      deletedAt: null,
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true },
  });
  return !existing;
}

// ── Campagnes planifiées dont l'heure est arrivée ─────────────────────────────

export async function getDueCampaigns(): Promise<CampaignDTO[]> {
  const campaigns = await db.campaign.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      scheduledAt: { lte: new Date() },
      // SMS (et futur WhatsApp) ont leur propre chemin d'envoi — voir
      // getDueSmsCampaigns() dans features/sms — pour ne pas les faire
      // échouer en passant par sendCampaignCore qui exige un templateId email.
      channels: { has: "EMAIL" },
    },
    select: CAMPAIGN_SELECT,
    take: 10,
  });
  return campaigns.map(toDTO);
}

// ── Synchroniser les stats d'une campagne depuis les logs de messages ─────────

export async function syncCampaignStatsFromBatch(campaignId: string): Promise<void> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { emailBatchId: true },
  });
  if (!campaign?.emailBatchId) return;
  await recomputeBatchStats(campaign.emailBatchId);
}
