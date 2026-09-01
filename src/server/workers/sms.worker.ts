import { Worker, Queue } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendSms, checkSmsBalance } from "@/lib/providers/mtarget";
import { personalizeSmsMessage } from "@/lib/sms/personalizer";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { isValidSmsNumber, normalizePhoneNumber } from "@/lib/sms/validator";
import type { SmsJobPayload } from "@/features/sms/types";

const QUEUE_NAME = "sms-send";
const BATCH_SIZE = 100;
const BATCH_DELAY = 2_000;
const SEND_INTERVAL = 100;
const COST_PER_SMS_FCFA = 7;
const MIN_BALANCE_EUR = 2;

export const smsQueue = redis
  ? new Queue<SmsJobPayload>(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
      },
    })
  : null;

export async function queueSmsBatch(payload: SmsJobPayload): Promise<string | null> {
  if (!smsQueue) {
    logger.warn("SMS queue not available");
    return null;
  }

  const job = await smsQueue.add("send-sms-batch", payload, { priority: 2 });

  logger.info(
    { jobId: job.id, campaignId: payload.campaignId, count: payload.clientIds.length },
    "SMS batch job queued"
  );

  return job.id ?? null;
}

export function createSmsWorker(): Worker | null {
  if (!redis) return null;

  const worker = new Worker<SmsJobPayload>(
    QUEUE_NAME,
    async (job) => {
      const { campaignId, variantId, clientIds, campaignVars } = job.data;

      logger.info(
        { jobId: job.id, campaignId, count: clientIds.length },
        "SMS batch started"
      );

      const variant = await db.campaignVariant.findUnique({
        where: { id: variantId },
        select: { content: true, senderId: true },
      });
      if (!variant) {
        await db.campaign.update({
          where: { id: campaignId },
          data: { status: "FAILED" },
        });
        throw new Error(`CampaignVariant ${variantId} introuvable`);
      }

      const balance = await checkSmsBalance();
      if (
        balance.success &&
        balance.amount !== undefined &&
        balance.amount < MIN_BALANCE_EUR
      ) {
        logger.error(
          { amount: balance.amount, currency: balance.currency },
          `Crédit Mtarget insuffisant (${balance.amount}€) — Batch annulé`
        );
        await db.campaign.update({
          where: { id: campaignId },
          data: { status: "FAILED" },
        });
        throw new Error(`Crédit Mtarget insuffisant (${balance.amount}€)`);
      }

      let sentCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      let creditExhausted = false;
      const totalBatches = Math.ceil(clientIds.length / BATCH_SIZE);

      for (let i = 0; i < clientIds.length && !creditExhausted; i += BATCH_SIZE) {
        const batchClientIds = clientIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        await job.updateProgress(Math.round((i / clientIds.length) * 100));

        const clients = await db.client.findMany({
          where: { id: { in: batchClientIds } },
          select: { id: true, phone: true, firstName: true, smsConsent: true },
        });

        for (const client of clients) {
          if (creditExhausted) break;

          const existing = await db.message.findFirst({
            where: { campaignId, clientId: client.id, channel: "SMS" },
          });
          if (existing) continue;

          // Double vérification — le segment a pu être rafraîchi entre la mise
          // en queue et le traitement du job.
          if (!client.smsConsent) {
            await db.message.create({
              data: {
                campaignId,
                variantId,
                clientId: client.id,
                channel: "SMS",
                recipient: client.phone ?? "",
                content: "",
                status: "SKIPPED",
                metadata: { reason: "Consentement SMS manquant" },
              },
            });
            skippedCount++;
            logger.info({ clientId: client.id }, "SMS skipped — no consent");
            continue;
          }

          const normalizedPhone = client.phone
            ? normalizePhoneNumber(client.phone)
            : null;
          if (!normalizedPhone || !isValidSmsNumber(normalizedPhone)) {
            await db.message.create({
              data: {
                campaignId,
                variantId,
                clientId: client.id,
                channel: "SMS",
                recipient: client.phone ?? "",
                content: "",
                status: "FAILED",
                errorCode: "INVALID_PHONE",
                errorMessage: "Numéro de téléphone invalide",
              },
            });
            failedCount++;
            logger.info({ clientId: client.id }, "SMS failed — invalid phone number");
            continue;
          }

          const message = personalizeSmsMessage(
            variant.content,
            { firstName: client.firstName },
            campaignVars
          );
          const analysis = analyzeMessage(message);

          // Créée en PENDING d'abord — son id sert de remoteid Mtarget, ce qui
          // permet au webhook DLR de retrouver ce message directement.
          const pending = await db.message.create({
            data: {
              campaignId,
              variantId,
              clientId: client.id,
              channel: "SMS",
              recipient: normalizedPhone,
              senderId: variant.senderId,
              content: message,
              status: "PENDING",
              providerName: "mtarget",
              cost: analysis.smsCount * COST_PER_SMS_FCFA,
              segments: analysis.smsCount,
            },
          });

          const result = await sendSms(normalizedPhone, message, pending.id);

          await db.message.update({
            where: { id: pending.id },
            data: {
              status: result.success ? "SENT" : "FAILED",
              externalId: result.messageId ?? null,
              errorMessage: result.error ?? null,
              sentAt: result.success ? new Date() : null,
              failedAt: result.success ? null : new Date(),
            },
          });

          if (result.success) {
            sentCount++;
            logger.info({ clientId: client.id, ticket: result.messageId }, "SMS sent");
          } else {
            failedCount++;
            logger.error(
              { clientId: client.id, error: result.error, code: result.code },
              "SMS send failed"
            );

            if (result.code === "-11") {
              logger.error("Crédit Mtarget insuffisant — Batch annulé");
              creditExhausted = true;
              break;
            }
          }

          await sleep(SEND_INTERVAL);
        }

        await db.campaign.update({
          where: { id: campaignId },
          data: { totalSent: sentCount, totalFailed: failedCount },
        });

        logger.info(
          { campaignId, batchNumber, totalBatches, sent: sentCount, failed: failedCount },
          `SMS batch ${batchNumber}/${totalBatches} done`
        );

        if (i + BATCH_SIZE < clientIds.length) {
          await sleep(BATCH_DELAY);
        }
      }

      await db.campaign.update({
        where: { id: campaignId },
        data: {
          status: creditExhausted ? "FAILED" : "SENT",
          sentAt: new Date(),
          completedAt: new Date(),
          totalRecipients: clientIds.length,
          totalSent: sentCount,
          totalFailed: failedCount,
          deliveryRate: 0,
          actualCost: sentCount * COST_PER_SMS_FCFA,
        },
      });

      logger.info(
        { campaignId, sentCount, failedCount, skippedCount, creditExhausted },
        "SMS batch completed"
      );

      return { sentCount, failedCount, skippedCount };
    },
    { connection: redis, concurrency: 2 }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, result }, "SMS worker job completed");
  });

  worker.on("failed", async (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "SMS worker job failed");

    if (job?.data.campaignId && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await db.campaign
        .update({ where: { id: job.data.campaignId }, data: { status: "FAILED" } })
        .catch(() => {});
    }
  });

  return worker;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
