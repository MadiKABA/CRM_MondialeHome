import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getTemplateById } from "@/features/templates/server/queries";
import { getEligibleClientsForEmail } from "./queries";
import { queueEmailBatch } from "@/server/workers/email.worker";
import type { SendEmailBatchInput, SendEmailResult } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// Logique métier pure de l'envoi à un segment — sans headers()/checkPermission()/
// checkRateLimit(), pour être appelable depuis une Server Action (utilisateur)
// ou depuis un worker BullMQ (déclencheur système, ex: campagne planifiée).
export async function sendEmailToSegmentCore(
  input: SendEmailBatchInput,
  actorId: string
): Promise<Result<SendEmailResult>> {
  try {
    const template = await getTemplateById(input.templateId);
    if (!template) return { success: false, error: "Template introuvable" };
    if (!template.isActive) return { success: false, error: "Ce template est désactivé" };
    if (!template.subject)
      return { success: false, error: "Le template n'a pas d'objet email" };

    const segment = await db.segment.findUnique({
      where: { id: input.segmentId },
      select: { id: true, name: true, memberCount: true },
    });
    if (!segment) return { success: false, error: "Segment introuvable" };

    const clients = await getEligibleClientsForEmail(input.segmentId);

    if (clients.length === 0) {
      return {
        success: false,
        error: "Aucun client éligible dans ce segment (vérifiez les consentements email)",
      };
    }

    const skipped = segment.memberCount - clients.length;

    const batch = await db.emailBatch.create({
      data: {
        templateId: input.templateId,
        segmentId: input.segmentId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        campaignData: input.campaignData as any,
        status: "PENDING",
        totalCount: clients.length,
        createdById: actorId,
      },
    });

    const jobId = await queueEmailBatch({
      batchId: batch.id,
      templateId: input.templateId,
      clientIds: clients.map((c) => c.id),
      campaignData: input.campaignData,
      triggeredBy: actorId,
    });

    await db.auditLog.create({
      data: {
        userId: actorId,
        action: "email.batch.created",
        entity: "EmailBatch",
        entityId: batch.id,
        newValue: {
          templateId: input.templateId,
          segmentId: input.segmentId,
          totalClients: clients.length,
          skipped,
          jobId,
        },
        status: "success",
      },
    });

    logger.info(
      { batchId: batch.id, jobId, total: clients.length },
      "Email batch queued"
    );

    const estimatedTime = Math.ceil((clients.length / 50) * 2);

    return {
      success: true,
      data: { batchId: batch.id, queued: clients.length, skipped, estimatedTime },
    };
  } catch (error) {
    logger.error({ error }, "sendEmailToSegmentCore failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}
