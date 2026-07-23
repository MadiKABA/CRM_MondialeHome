import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isTransitionAllowed, type CampaignStatus } from "@/features/campaigns/types";
import { queueSmsBatch } from "@/server/workers/sms.worker";
import {
  getEligibleClientsForSms,
  getSmsCampaignForSend,
  parseSmsCampaignData,
} from "./queries";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// Logique métier pure de l'envoi d'une campagne SMS — sans headers()/
// checkPermission()/checkRateLimit()/revalidatePath(), pour être appelable
// depuis une Server Action (utilisateur) ou depuis le scheduler (campagnes
// planifiées, sans requête HTTP) — voir campaign.worker.ts.
export async function sendSmsCampaignCore(
  campaignId: string,
  actorId: string
): Promise<Result<{ queued: number; estimatedTime: number }>> {
  try {
    const campaign = await getSmsCampaignForSend(campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };
    if (!campaign.channels.includes("SMS"))
      return { success: false, error: "Cette campagne n'est pas une campagne SMS" };
    if (!isTransitionAllowed(campaign.status as CampaignStatus, "SENDING")) {
      return {
        success: false,
        error: `Impossible d'envoyer une campagne en statut "${campaign.status}"`,
      };
    }

    const variant = campaign.variants[0];
    if (!variant) return { success: false, error: "Message SMS manquant" };
    if (!campaign.segmentId) return { success: false, error: "Segment manquant" };

    const clients = await getEligibleClientsForSms(campaign.segmentId);
    if (clients.length === 0) {
      return {
        success: false,
        error:
          "Aucun client éligible dans ce segment (vérifiez les consentements SMS et numéros de téléphone)",
      };
    }

    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING", totalRecipients: clients.length },
    });

    const jobId = await queueSmsBatch({
      campaignId: campaign.id,
      variantId: variant.id,
      clientIds: clients.map((c) => c.id),
      campaignVars: parseSmsCampaignData(campaign.smsCampaignData),
      triggeredBy: actorId,
    });

    if (!jobId) {
      await db.campaign.update({
        where: { id: campaign.id },
        data: { status: "FAILED" },
      });
      return { success: false, error: "File d'attente SMS indisponible" };
    }

    logger.info(
      { campaignId: campaign.id, jobId, queued: clients.length },
      "SMS campaign send triggered"
    );

    return {
      success: true,
      data: {
        queued: clients.length,
        estimatedTime: Math.ceil((clients.length * 100) / 1000),
      },
    };
  } catch (error) {
    logger.error({ error }, "sendSmsCampaignCore failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}
