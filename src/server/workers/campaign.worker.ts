import { Worker, Queue } from "bullmq";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  getDueCampaigns,
  syncCampaignStatsFromBatch,
} from "@/features/campaigns/server/queries";
import { sendCampaignCore } from "@/features/campaigns/server/service";

const SCHEDULER_QUEUE = "campaign-scheduler";
const STATS_QUEUE = "campaign-stats-sync";

// ── Worker scheduler ──────────────────────────────────────────────────────────
// Vérifie chaque minute les campagnes planifiées dont l'heure est arrivée

export function createCampaignSchedulerWorker(): Worker | null {
  if (!redis) return null;

  const schedulerQueue = new Queue(SCHEDULER_QUEUE, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
    },
  });

  // Job répétitif toutes les minutes
  schedulerQueue
    .add("check-due-campaigns", {}, { repeat: { pattern: "* * * * *" } })
    .catch((err) => logger.warn({ err }, "Failed to register campaign scheduler cron"));

  const worker = new Worker(
    SCHEDULER_QUEUE,
    async () => {
      const due = await getDueCampaigns();
      if (due.length === 0) return;

      logger.info({ count: due.length }, "campaigns due for sending");

      for (const campaign of due) {
        try {
          const result = await sendCampaignCore(campaign.id, campaign.createdById);

          if (result.success) {
            if (result.data) {
              await db.auditLog
                .create({
                  data: {
                    userId: campaign.createdById,
                    action: "campaign.send",
                    entity: "Campaign",
                    entityId: campaign.id,
                    newValue: {
                      batchId: result.data.batchId,
                      queued: result.data.queued,
                      estimatedTime: result.data.estimatedTime,
                      trigger: "scheduler",
                    },
                    status: "success",
                  },
                })
                .catch(() => {});
            }
            logger.info(
              { campaignId: campaign.id, name: campaign.name },
              "scheduled campaign sent"
            );
          } else {
            logger.error(
              { campaignId: campaign.id, error: result.error },
              "failed to send scheduled campaign"
            );
            await db.campaign
              .update({
                where: { id: campaign.id },
                data: { status: "FAILED" },
              })
              .catch(() => {});
          }
        } catch (err) {
          logger.error({ err, campaignId: campaign.id }, "campaign scheduler error");
        }
      }
    },
    { connection: redis, concurrency: 1 }
  );

  worker.on("failed", (job, error) => {
    logger.error(
      { jobId: job?.id, error: error.message },
      "campaign scheduler job failed"
    );
  });

  return worker;
}

// ── Worker stats sync ─────────────────────────────────────────────────────────
// Synchronise toutes les 5 minutes les stats des campagnes en cours

export function createCampaignStatsSyncWorker(): Worker | null {
  if (!redis) return null;

  const statsQueue = new Queue(STATS_QUEUE, { connection: redis });

  statsQueue
    .add(
      "sync-campaign-stats",
      {},
      { repeat: { pattern: "*/5 * * * *" }, removeOnComplete: 5 }
    )
    .catch((err) => logger.warn({ err }, "Failed to register stats sync cron"));

  const worker = new Worker(
    STATS_QUEUE,
    async () => {
      const sending = await db.campaign.findMany({
        where: {
          status: { in: ["SENDING"] },
          deletedAt: null,
          emailBatchId: { not: null },
        },
        select: { id: true },
        take: 20,
      });

      for (const campaign of sending) {
        try {
          await syncCampaignStatsFromBatch(campaign.id);
        } catch (err) {
          logger.warn({ err, campaignId: campaign.id }, "stats sync failed");
        }
      }

      if (sending.length > 0) {
        logger.info({ count: sending.length }, "campaign stats synced");
      }
    },
    { connection: redis, concurrency: 1 }
  );

  return worker;
}
