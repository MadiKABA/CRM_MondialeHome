import { Queue, Worker } from "bullmq";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { calculateRFM } from "@/features/rfm/calculator";
import { getAllClientsRFMData } from "@/features/rfm/server/queries";
import { invalidateCache, CACHE_KEYS } from "@/features/dashboard/lib/cache";
import type { RFMBatchResult } from "@/features/rfm/types";

const QUEUE_NAME = "rfm-calculation";

// Null quand Redis absent (dev sans REDIS_URL)
export const rfmQueue = redis
  ? new Queue(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    })
  : null;

export async function scheduleNightlyRFM(): Promise<void> {
  if (!rfmQueue) return;

  const existing = await rfmQueue.getRepeatableJobs();
  if (existing.some((j) => j.name === "nightly-rfm")) return;

  await rfmQueue.add(
    "nightly-rfm",
    { triggeredBy: "scheduler" },
    { repeat: { pattern: "0 2 * * *" } }
  );
  logger.info("RFM nightly job scheduled at 02:00 UTC");
}

export async function triggerRFMCalculation(triggeredBy = "manual"): Promise<void> {
  if (!rfmQueue) return;
  await rfmQueue.add("rfm-calculation", { triggeredBy }, { priority: 1 });
  logger.info({ triggeredBy }, "RFM calculation job queued");
}

export function createRFMWorker(): Worker | null {
  if (!redis) return null;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      logger.info(
        { jobId: job.id, triggeredBy: job.data.triggeredBy },
        "Starting RFM calculation"
      );

      const startTime = Date.now();
      const result: RFMBatchResult = {
        processed: 0,
        updated: 0,
        errors: 0,
        duration: 0,
        breakdown: {
          champions: 0,
          loyal: 0,
          potential: 0,
          new_customers: 0,
          at_risk: 0,
          lost: 0,
          others: 0,
        },
      };

      let batchNumber = 0;
      for await (const batch of getAllClientsRFMData(500)) {
        batchNumber++;
        await job.updateProgress(
          Math.min(95, (batchNumber * 500) / Math.max(result.processed + batch.length, 1))
        );

        const rfmResults = batch.map((data) => calculateRFM(data));

        try {
          await db.$transaction(
            rfmResults.map((rfm) =>
              db.client.update({
                where: { id: rfm.clientId },
                data: {
                  rfmScore: rfm.profile,
                  rfmRecency: rfm.r,
                  rfmFrequency: rfm.f,
                  rfmMonetary: rfm.m,
                  rfmCalculatedAt: new Date(),
                },
              })
            )
          );

          result.processed += batch.length;
          result.updated += rfmResults.length;
          for (const rfm of rfmResults) result.breakdown[rfm.profile]++;
        } catch (batchError) {
          result.errors += batch.length;
          logger.error({ batchError, batchNumber }, `RFM batch ${batchNumber} failed`);
        }
      }

      result.duration = Date.now() - startTime;

      await refreshDynamicRFMSegments();

      await db.setting.upsert({
        where: { key: "rfm_last_run" },
        update: { value: JSON.stringify({ ...result, runAt: new Date() }) },
        create: {
          key: "rfm_last_run",
          value: JSON.stringify({ ...result, runAt: new Date() }),
        },
      });

      await invalidateCache(CACHE_KEYS.rfmStats());
      await invalidateCache(CACHE_KEYS.segments());

      logger.info(
        { result },
        `RFM done: ${result.processed} clients in ${result.duration}ms`
      );

      return result;
    },
    { connection: redis, concurrency: 1 }
  );

  worker.on("completed", (job, returnValue) => {
    logger.info({ jobId: job.id, returnValue }, "RFM job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "RFM job failed");
  });

  return worker;
}

async function refreshDynamicRFMSegments(): Promise<void> {
  try {
    const segments = await db.segment.findMany({
      where: {
        type: "DYNAMIC",
        isActive: true,
      },
      select: { id: true, name: true, criteria: true },
    });

    // Filtrer les segments dont les critères contiennent rfmScore
    const rfmSegments = segments.filter((s) => {
      const criteria = s.criteria as {
        criteria?: Array<{ field: string }>;
      } | null;
      return criteria?.criteria?.some((c) => c.field === "rfmScore");
    });

    for (const segment of rfmSegments) {
      try {
        const criteria = segment.criteria as {
          criteria: Array<{ field: string; value: string }>;
        };

        const where: Record<string, unknown> = {
          deletedAt: null,
          status: { not: "BLACKLISTED" },
        };

        for (const c of criteria.criteria) {
          if (c.field === "rfmScore") where.rfmScore = c.value;
        }

        const clients = await db.client.findMany({
          where: where as Prisma.ClientWhereInput,
          select: { id: true },
          take: 10_000,
        });

        await db.$transaction([
          db.segmentMember.deleteMany({ where: { segmentId: segment.id } }),
          ...(clients.length > 0
            ? [
                db.segmentMember.createMany({
                  data: clients.map((c) => ({
                    segmentId: segment.id,
                    clientId: c.id,
                  })),
                  skipDuplicates: true,
                }),
              ]
            : []),
          db.segment.update({
            where: { id: segment.id },
            data: { memberCount: clients.length, lastRefreshedAt: new Date() },
          }),
        ]);

        logger.info(
          { segmentId: segment.id, memberCount: clients.length },
          `RFM segment "${segment.name}" refreshed`
        );
      } catch (segError) {
        logger.error(
          { segError, segmentId: segment.id },
          "Failed to refresh RFM segment"
        );
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to refresh dynamic RFM segments");
  }
}
