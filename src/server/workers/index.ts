import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/lib/queue";
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { createRFMWorker, scheduleNightlyRFM } from "./rfm.worker";

logger.info("🚀 Starting CRM workers...");

if (!redis) {
  logger.warn("Redis not available — workers disabled (no REDIS_URL in dev)");
  process.exit(0);
}

const connection = redis;

// ============================================================
// CAMPAIGN WORKER
// ============================================================
const campaignWorker = new Worker(
  QUEUE_NAMES.CAMPAIGNS,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing campaign job");
    // TODO: implémenter selon le type (sms/email/whatsapp)
  },
  { connection }
);

// ============================================================
// MESSAGE WORKER
// ============================================================
const messageWorker = new Worker(
  QUEUE_NAMES.MESSAGES,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing message job");
    // TODO: dispatcher vers provider (Africa's Talking / Brevo)
  },
  { connection }
);

// ============================================================
// AUTOMATION WORKER
// ============================================================
const automationWorker = new Worker(
  QUEUE_NAMES.AUTOMATIONS,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing automation job");
    // TODO: exécuter l'étape d'automatisation
  },
  { connection }
);

// ============================================================
// IMPORT WORKER
// ============================================================
const importWorker = new Worker(
  QUEUE_NAMES.IMPORTS,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing import job");
    // TODO: parser CSV/XLSX et insérer en DB
  },
  { connection }
);

// ============================================================
// EXPORT WORKER
// ============================================================
const exportWorker = new Worker(
  QUEUE_NAMES.EXPORTS,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing export job");
    // TODO: générer CSV/XLSX et uploader sur Cloudinary
  },
  { connection }
);

// ============================================================
// WEBHOOK WORKER
// ============================================================
const webhookWorker = new Worker(
  QUEUE_NAMES.WEBHOOKS,
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing webhook job");
    // TODO: traiter les callbacks de livraison
  },
  { connection }
);

// ============================================================
// RFM WORKER
// ============================================================
const rfmWorker = createRFMWorker();
if (rfmWorker) {
  scheduleNightlyRFM().then(() => {
    logger.info("✅ RFM worker started — nightly at 02:00 UTC");
  });
}

const baseWorkers = [
  campaignWorker,
  messageWorker,
  automationWorker,
  importWorker,
  exportWorker,
  webhookWorker,
];

baseWorkers.forEach((worker) => {
  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, queue: worker.name }, "Job completed");
  });
  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, queue: worker.name, err }, "Job failed");
  });
});

logger.info({ queues: Object.values(QUEUE_NAMES) }, "✅ All workers started");

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down workers...");
  const closeAll = [
    ...baseWorkers.map((w) => w.close()),
    ...(rfmWorker ? [rfmWorker.close()] : []),
  ];
  await Promise.all(closeAll);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
