import { Worker, Queue } from "bullmq";
import { redis } from "@/lib/redis";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CONFIG } from "@/lib/email/config";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getTemplateById } from "@/features/templates/server/queries";
import {
  personalizeEmail,
  checkClientEligibility,
} from "@/features/email-mass/lib/personalizer";
import type { EmailJobPayload } from "@/features/email-mass/types";

const QUEUE_NAME = "email-send";
const BATCH_SIZE = 50;
const BATCH_DELAY = 1000;
const SEND_INTERVAL = 120; // Resend limite à 10 req/s, on reste en dessous

export const emailQueue = redis
  ? new Queue<EmailJobPayload>(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
      },
    })
  : null;

export async function queueEmailBatch(payload: EmailJobPayload): Promise<string | null> {
  if (!emailQueue) {
    logger.warn("Email queue not available");
    return null;
  }

  const job = await emailQueue.add("send-email-batch", payload, { priority: 2 });

  logger.info(
    { jobId: job.id, batchId: payload.batchId, count: payload.clientIds.length },
    "Email batch job queued"
  );

  return job.id ?? null;
}

export function createEmailWorker(): Worker | null {
  if (!redis) return null;

  const worker = new Worker<EmailJobPayload>(
    QUEUE_NAME,
    async (job) => {
      const { batchId, templateId, clientIds, campaignData } = job.data;

      logger.info(
        { jobId: job.id, batchId, total: clientIds.length },
        "Email batch started"
      );

      await db.emailBatch.update({
        where: { id: batchId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      const template = await getTemplateById(templateId);
      if (!template || !template.subject) {
        await db.emailBatch.update({
          where: { id: batchId },
          data: { status: "FAILED" },
        });
        throw new Error(`Template ${templateId} introuvable ou sans objet`);
      }

      const resend = getResendClient();
      let sentCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const totalBatches = Math.ceil(clientIds.length / BATCH_SIZE);

      for (let i = 0; i < clientIds.length; i += BATCH_SIZE) {
        const batchClientIds = clientIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        await job.updateProgress(Math.round((i / clientIds.length) * 100));

        const clients = await db.client.findMany({
          where: { id: { in: batchClientIds } },
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

        for (const client of clients) {
          const existing = await db.messageLog.findFirst({
            where: { batchId, clientId: client.id },
          });
          if (existing) continue;

          const clientData = {
            id: client.id,
            email: client.email ?? "",
            firstName: client.firstName,
            lastName: client.lastName,
            city: client.city,
            district: client.district,
            totalSpent: Number(client.totalSpent ?? 0),
            totalOrders: client.totalOrders ?? 0,
            lastPurchaseAt: client.lastPurchaseAt,
            emailConsent: client.emailConsent,
          };

          const eligibility = checkClientEligibility(clientData);

          if (!eligibility.eligible) {
            await db.messageLog.create({
              data: {
                batchId,
                templateId,
                clientId: client.id,
                email: client.email ?? "",
                status: "SKIPPED",
                metadata: { reason: eligibility.reason },
              },
            });
            skippedCount++;
            continue;
          }

          let personalizedEmail;
          try {
            personalizedEmail = personalizeEmail(clientData, template, campaignData);
          } catch (err) {
            logger.error({ err, clientId: client.id }, "Personalization failed");
            failedCount++;
            continue;
          }

          const messageLog = await db.messageLog.create({
            data: {
              batchId,
              templateId,
              clientId: client.id,
              email: personalizedEmail.to,
              status: "PENDING",
            },
          });

          try {
            const { data, error } = await resend.emails.send({
              from: EMAIL_CONFIG.from.formatted,
              to: [personalizedEmail.to],
              subject: personalizedEmail.subject,
              html: personalizedEmail.html,
              tags: [
                { name: "batch_id", value: batchId },
                { name: "client_id", value: client.id },
                { name: "template", value: sanitizeTagValue(template.name) },
              ],
            });

            if (error) {
              await db.messageLog.update({
                where: { id: messageLog.id },
                data: { status: "FAILED", errorMessage: error.message },
              });
              failedCount++;
            } else {
              await db.messageLog.update({
                where: { id: messageLog.id },
                data: { status: "SENT", resendId: data?.id ?? null, sentAt: new Date() },
              });
              sentCount++;
            }
          } catch (sendErr: unknown) {
            const msg = sendErr instanceof Error ? sendErr.message : "Erreur inconnue";
            await db.messageLog.update({
              where: { id: messageLog.id },
              data: { status: "FAILED", errorMessage: msg },
            });
            failedCount++;
            logger.error({ err: sendErr, clientId: client.id }, "Email send failed");
          }

          await sleep(SEND_INTERVAL);
        }

        await db.emailBatch.update({
          where: { id: batchId },
          data: { sentCount, failedCount },
        });

        logger.info(
          { batchId, batchNumber, totalBatches, sent: sentCount, failed: failedCount },
          `Email batch ${batchNumber}/${totalBatches} done`
        );

        if (i + BATCH_SIZE < clientIds.length) {
          await sleep(BATCH_DELAY);
        }
      }

      await db.emailBatch.update({
        where: { id: batchId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          sentCount,
          failedCount,
          totalCount: clientIds.length,
        },
      });

      logger.info(
        { batchId, sentCount, failedCount, skippedCount },
        "Email batch completed"
      );

      return { sentCount, failedCount, skippedCount };
    },
    { connection: redis, concurrency: 2 }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, result }, "Email worker job completed");
  });

  worker.on("failed", async (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "Email worker job failed");

    if (job?.data.batchId && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await db.emailBatch
        .update({ where: { id: job.data.batchId }, data: { status: "FAILED" } })
        .catch(() => {});
    }
  });

  return worker;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resend n'accepte que [a-zA-Z0-9_-] dans les valeurs de tags
function sanitizeTagValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}
