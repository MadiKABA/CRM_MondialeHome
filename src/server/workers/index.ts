import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/lib/queue";
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";

logger.info("🚀 Starting CRM workers...");

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

const workers = [
  campaignWorker,
  messageWorker,
  automationWorker,
  importWorker,
  exportWorker,
  webhookWorker,
];

workers.forEach((worker) => {
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
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
