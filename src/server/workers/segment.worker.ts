import { Queue, Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { refreshProductBasedSegments } from "@/features/segments/server/queries";

const QUEUE_NAME = "segment-refresh";

// Null quand Redis absent (dev sans REDIS_URL)
export const segmentQueue = redis
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

// ── Déclenché après une vente (créée ou importée) ─────────────────────────────
// Ne bloque jamais l'action appelante : si Redis est indisponible, on log et
// on continue (le rafraîchissement manuel via le bouton reste possible).

export async function triggerProductSegmentsRefresh(triggeredBy = "sale"): Promise<void> {
  if (!segmentQueue) return;
  try {
    await segmentQueue.add(
      "refresh-product-segments",
      { triggeredBy },
      { jobId: `refresh-product-segments-${Date.now()}` }
    );
  } catch (error) {
    logger.error({ error, triggeredBy }, "Failed to queue segment refresh job");
  }
}

export function createSegmentWorker(): Worker | null {
  if (!redis) return null;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const startTime = Date.now();
      const refreshed = await refreshProductBasedSegments();
      logger.info(
        {
          jobId: job.id,
          triggeredBy: job.data.triggeredBy,
          refreshed,
          duration: Date.now() - startTime,
        },
        `Product-based segments refreshed: ${refreshed} segment(s)`
      );
      return { refreshed };
    },
    { connection: redis, concurrency: 1 }
  );

  worker.on("completed", (job, returnValue) => {
    logger.info({ jobId: job.id, returnValue }, "Segment refresh job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Segment refresh job failed");
  });

  return worker;
}
