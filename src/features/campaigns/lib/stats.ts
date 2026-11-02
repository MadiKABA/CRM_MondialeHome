// PAS de "server-only" : importé par le worker tsx
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { computeRates, countsFromStatuses, type StatusCounts } from "./stats-math";

// Compte les logs d'un lot par statut (source de vérité)
export async function getBatchCounts(batchId: string): Promise<StatusCounts> {
  const groups = await db.messageLog.groupBy({
    by: ["status"],
    where: { batchId },
    _count: { _all: true },
  });
  const byStatus: Record<string, number> = {};
  for (const g of groups) byStatus[g.status] = g._count._all;
  return countsFromStatuses(byStatus);
}

// Met à jour les compteurs du lot ET de la campagne liée depuis les logs
export async function recomputeBatchStats(batchId: string): Promise<StatusCounts> {
  const counts = await getBatchCounts(batchId);
  const rates = computeRates(counts);

  await db.emailBatch.update({
    where: { id: batchId },
    data: {
      sentCount: counts.sent,
      deliveredCount: counts.delivered,
      openedCount: counts.opened,
      clickedCount: counts.clicked,
      bouncedCount: counts.bounced,
      failedCount: counts.failed,
    },
  });

  const campaign = await db.campaign.findUnique({
    where: { emailBatchId: batchId },
    select: { id: true, status: true, sentAt: true },
  });

  if (campaign) {
    const batch = await db.emailBatch.findUnique({
      where: { id: batchId },
      select: { status: true, totalCount: true, completedAt: true },
    });
    const completed = batch?.status === "COMPLETED" && campaign.status === "SENDING";

    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        ...(batch && batch.totalCount > 0 && { totalRecipients: batch.totalCount }),
        totalSent: counts.sent,
        totalDelivered: counts.delivered,
        totalOpened: counts.opened,
        totalClicked: counts.clicked,
        totalBounced: counts.bounced,
        totalFailed: counts.failed,
        ...rates,
        ...(completed && { status: "SENT" }),
        ...(!campaign.sentAt && counts.sent > 0 && { sentAt: new Date() }),
        ...(batch?.status === "FAILED" &&
          campaign.status === "SENDING" && { status: "FAILED" }),
      },
    });
  }

  return counts;
}

// Rattrapage : recalcule toutes les campagnes ayant un lot d'envoi
export async function recomputeAllCampaignStats(): Promise<{
  processed: number;
  failed: number;
}> {
  const campaigns = await db.campaign.findMany({
    where: { deletedAt: null, emailBatchId: { not: null } },
    select: { id: true, emailBatchId: true },
  });

  let processed = 0;
  let failed = 0;
  for (const c of campaigns) {
    try {
      await recomputeBatchStats(c.emailBatchId as string);
      processed++;
    } catch (err) {
      failed++;
      logger.warn({ err, campaignId: c.id }, "recompute campaign stats failed");
    }
  }
  return { processed, failed };
}
