import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendEmailToSegmentCore } from "@/features/email-mass/server/service";
import { getCampaignById } from "./queries";
import { isTransitionAllowed } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// Logique métier pure de l'envoi d'une campagne — sans headers()/checkPermission()/
// checkRateLimit()/revalidatePath(), pour être appelable depuis une Server Action
// (utilisateur) ou depuis le worker BullMQ (campagnes planifiées, sans requête HTTP).
export async function sendCampaignCore(
  campaignId: string,
  actorId: string
): Promise<Result<{ batchId: string; queued: number; estimatedTime: number }>> {
  try {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };

    if (!isTransitionAllowed(campaign.status, "SENDING")) {
      return {
        success: false,
        error: `Impossible d'envoyer une campagne en statut "${campaign.status}"`,
      };
    }

    if (!campaign.templateId) {
      return { success: false, error: "Template email manquant" };
    }
    if (!campaign.segmentId) {
      return { success: false, error: "Segment manquant" };
    }

    // Marquer en SENDING
    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING" },
    });

    const sendResult = await sendEmailToSegmentCore(
      {
        templateId: campaign.templateId,
        segmentId: campaign.segmentId,
        campaignData: campaign.campaignData ?? {
          articles: [],
          freeImages: [],
          contentMode: "articles",
          ctaText: null,
          ctaUrl: null,
          bannerImageUrl: null,
          bannerLinkUrl: null,
          campaignVars: {},
        },
      },
      actorId
    );

    if (!sendResult.success || !sendResult.data) {
      // Rollback statut
      await db.campaign.update({
        where: { id: campaign.id },
        data: { status: "FAILED" },
      });
      const errorMsg = !sendResult.success ? sendResult.error : "Erreur d'envoi";
      return { success: false, error: errorMsg };
    }

    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        emailBatchId: sendResult.data.batchId,
        totalRecipients: sendResult.data.queued,
      },
    });

    logger.info(
      {
        campaignId: campaign.id,
        batchId: sendResult.data.batchId,
        queued: sendResult.data.queued,
      },
      "campaign send triggered"
    );

    return {
      success: true,
      data: {
        batchId: sendResult.data.batchId,
        queued: sendResult.data.queued,
        estimatedTime: sendResult.data.estimatedTime,
      },
    };
  } catch (error) {
    logger.error({ error }, "sendCampaignCore failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}
