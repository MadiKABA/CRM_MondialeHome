"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth/auth";
import { sendEmailToSegment } from "@/features/email-mass/server/actions";
import {
  getCampaignById,
  isCampaignNameUnique,
  syncCampaignStatsFromBatch,
} from "./queries";
import {
  createCampaignSchema,
  updateCampaignSchema,
  scheduleCampaignSchema,
  sendCampaignSchema,
  cancelCampaignSchema,
  duplicateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "../schemas/campaign.schema";
import { isTransitionAllowed, DELETABLE_STATUSES } from "../types";
import type { EmailCampaignData } from "@/features/email-mass/types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function createAuditLog(
  userId: string,
  action: string,
  entityId?: string,
  meta?: object
) {
  try {
    const h = await headers();
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity: "Campaign",
        entityId: entityId ?? null,
        newValue: meta as never,
        ipAddress: h.get("x-forwarded-for") ?? null,
        userAgent: h.get("user-agent") ?? null,
        status: "success",
      },
    });
  } catch {
    // L'audit ne bloque jamais l'opération principale
  }
}

// ── CRÉER UNE CAMPAGNE ────────────────────────────────────────────────────────

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `campaign:create:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("campaigns.create.all");

    const data = createCampaignSchema.parse(input);

    const isUnique = await isCampaignNameUnique(data.name);
    if (!isUnique) {
      return {
        success: false,
        error: "Une campagne avec ce nom existe déjà",
      };
    }

    const segment = await db.segment.findUnique({
      where: { id: data.segmentId },
      select: { id: true, memberCount: true },
    });
    if (!segment) return { success: false, error: "Segment introuvable" };

    if (data.templateId) {
      const template = await db.template.findUnique({
        where: { id: data.templateId },
        select: { id: true, isActive: true },
      });
      if (!template) return { success: false, error: "Template introuvable" };
      if (!template.isActive) {
        return { success: false, error: "Ce template est désactivé" };
      }
    }

    const campaign = await db.campaign.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        status: "DRAFT",
        type: "MANUAL",
        segmentId: data.segmentId,
        audienceType: "SEGMENT",
        channels: ["EMAIL"],
        templateId: data.templateId ?? null,
        campaignData: (data.campaignData as never) ?? null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: user.id,
      },
    });

    await createAuditLog(user.id, "campaign.create", campaign.id, {
      name: campaign.name,
      segmentId: campaign.segmentId,
    });

    revalidatePath("/campagnes");
    return { success: true, data: { id: campaign.id } };
  } catch (error) {
    logger.error({ error }, "createCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── MODIFIER UNE CAMPAGNE (DRAFT uniquement) ──────────────────────────────────

export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `campaign:update:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("campaigns.update.all");

    const data = updateCampaignSchema.parse(input);

    const existing = await db.campaign.findUnique({
      where: { id: campaignId, deletedAt: null },
      select: { status: true, name: true },
    });
    if (!existing) return { success: false, error: "Campagne introuvable" };
    if (existing.status !== "DRAFT") {
      return {
        success: false,
        error: "Seules les campagnes en brouillon peuvent être modifiées",
      };
    }

    if (data.name && data.name !== existing.name) {
      const isUnique = await isCampaignNameUnique(data.name, campaignId);
      if (!isUnique) {
        return { success: false, error: "Ce nom est déjà utilisé" };
      }
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.segmentId && { segmentId: data.segmentId }),
        ...(data.templateId !== undefined && {
          templateId: data.templateId ?? null,
        }),
        ...(data.campaignData !== undefined && {
          campaignData: (data.campaignData as never) ?? null,
        }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        updatedById: user.id,
      },
    });

    await createAuditLog(user.id, "campaign.update", campaignId);
    revalidatePath("/campagnes");
    revalidatePath(`/campagnes/${campaignId}`);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "updateCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ENVOYER UNE CAMPAGNE ──────────────────────────────────────────────────────

export async function sendCampaign(
  input: unknown
): Promise<Result<{ batchId: string; queued: number; estimatedTime: number }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `campaign:send:${user.id}`,
      limit: 3,
      windowMs: 300_000,
    });
    if (!rl.allowed) {
      return {
        success: false,
        error: "Trop d'envois. Attendez 5 minutes entre chaque campagne.",
      };
    }

    await checkPermission("campaigns.send.all");

    const data = sendCampaignSchema.parse(input);

    const campaign = await getCampaignById(data.campaignId);
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

    const sendResult = await sendEmailToSegment({
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      campaignData: campaign.campaignData ?? {
        articles: [],
        ctaText: null,
        ctaUrl: null,
        bannerImageUrl: null,
        campaignVars: {},
      },
    });

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

    await createAuditLog(user.id, "campaign.send", campaign.id, {
      batchId: sendResult.data.batchId,
      queued: sendResult.data.queued,
      estimatedTime: sendResult.data.estimatedTime,
    });

    logger.info(
      {
        campaignId: campaign.id,
        batchId: sendResult.data.batchId,
        queued: sendResult.data.queued,
      },
      "campaign send triggered"
    );

    revalidatePath("/campagnes");
    revalidatePath(`/campagnes/${campaign.id}`);

    return {
      success: true,
      data: {
        batchId: sendResult.data.batchId,
        queued: sendResult.data.queued,
        estimatedTime: sendResult.data.estimatedTime,
      },
    };
  } catch (error) {
    logger.error({ error }, "sendCampaign failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}

// ── PLANIFIER UNE CAMPAGNE ────────────────────────────────────────────────────

export async function scheduleCampaign(
  input: unknown
): Promise<Result<{ batchId: string; queued: number; estimatedTime: number } | void>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("campaigns.send.all");

    const data = scheduleCampaignSchema.parse(input);

    const campaign = await getCampaignById(data.campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };

    if (!isTransitionAllowed(campaign.status, "SCHEDULED")) {
      return {
        success: false,
        error: `Impossible de planifier une campagne en statut "${campaign.status}"`,
      };
    }

    // scheduledAt null = envoyer maintenant
    if (!data.scheduledAt) {
      return sendCampaign({ campaignId: data.campaignId });
    }

    await db.campaign.update({
      where: { id: data.campaignId },
      data: {
        status: "SCHEDULED",
        scheduledAt: new Date(data.scheduledAt),
      },
    });

    await createAuditLog(user.id, "campaign.schedule", data.campaignId, {
      scheduledAt: data.scheduledAt,
    });

    revalidatePath("/campagnes");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "scheduleCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ANNULER UNE CAMPAGNE ──────────────────────────────────────────────────────

export async function cancelCampaign(input: unknown): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("campaigns.cancel.all");

    const data = cancelCampaignSchema.parse(input);

    const campaign = await getCampaignById(data.campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };

    if (!isTransitionAllowed(campaign.status, "CANCELLED")) {
      return {
        success: false,
        error: `Impossible d'annuler une campagne en statut "${campaign.status}"`,
      };
    }

    await db.campaign.update({
      where: { id: data.campaignId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    // Annuler le batch email si en cours
    if (campaign.emailBatchId) {
      await db.emailBatch
        .update({
          where: { id: campaign.emailBatchId },
          data: { status: "CANCELLED" },
        })
        .catch(() => {});
    }

    await createAuditLog(user.id, "campaign.cancel", data.campaignId, {
      reason: data.reason,
    });

    revalidatePath("/campagnes");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "cancelCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── DUPLIQUER UNE CAMPAGNE ────────────────────────────────────────────────────

export async function duplicateCampaign(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("campaigns.create.all");

    const data = duplicateCampaignSchema.parse(input);

    const source = await db.campaign.findUnique({
      where: { id: data.campaignId, deletedAt: null },
    });
    if (!source) return { success: false, error: "Campagne introuvable" };

    const isUnique = await isCampaignNameUnique(data.newName);
    if (!isUnique) {
      return { success: false, error: "Ce nom est déjà utilisé" };
    }

    const copy = await db.campaign.create({
      data: {
        name: data.newName.trim(),
        description: source.description,
        status: "DRAFT",
        type: "MANUAL",
        segmentId: source.segmentId ?? undefined,
        audienceType: source.audienceType,
        channels: source.channels,
        templateId: source.templateId,
        campaignData: source.campaignData ?? undefined,
        scheduledAt: null,
        createdById: user.id,
      },
    });

    await createAuditLog(user.id, "campaign.duplicate", copy.id, {
      sourceId: source.id,
      newName: data.newName,
    });

    revalidatePath("/campagnes");
    return { success: true, data: { id: copy.id } };
  } catch (error) {
    logger.error({ error }, "duplicateCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── SUPPRIMER UNE CAMPAGNE (soft delete) ──────────────────────────────────────

export async function deleteCampaign(campaignId: string): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("campaigns.delete.all");

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId, deletedAt: null },
      select: { status: true, name: true },
    });
    if (!campaign) return { success: false, error: "Campagne introuvable" };

    if (
      !DELETABLE_STATUSES.includes(campaign.status as (typeof DELETABLE_STATUSES)[number])
    ) {
      return {
        success: false,
        error:
          "Seules les campagnes en brouillon, annulées ou échouées peuvent être supprimées",
      };
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog(user.id, "campaign.delete", campaignId, {
      name: campaign.name,
      status: campaign.status,
    });

    revalidatePath("/campagnes");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "deleteCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── SYNC STATS DEPUIS LE BATCH ────────────────────────────────────────────────
// Appelé par le webhook Resend et le worker stats

export async function syncCampaignStats(campaignId: string): Promise<void> {
  try {
    await syncCampaignStatsFromBatch(campaignId);
    revalidatePath(`/campagnes/${campaignId}`);
  } catch (error) {
    logger.error({ error, campaignId }, "syncCampaignStats failed");
  }
}

// ── RE-EXPORTER LES TYPES POUR LA COUCHE UI ───────────────────────────────────
// Évite que la UI importe directement depuis email-mass

export type { EmailCampaignData };
