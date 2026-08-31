"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth/auth";
import { buildEmailHtml } from "@/features/templates/lib/html-builder";
import {
  DEFAULT_TEST_DATA,
  DEFAULT_CAMPAIGN_VARS,
} from "@/features/templates/lib/renderer";
import { getTemplateById } from "@/features/templates/server/queries";
import { sendCampaignCore } from "./service";
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
import { isTransitionAllowed, DELETABLE_STATUSES, EDITABLE_STATUSES } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// Normalise un scheduledAt vers ISO complet avec "Z" — défense contre les
// datetime-local bruts ("2026-07-01T14:30") qui passeraient le client sans conversion.
function normalizeScheduledAt(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (typeof value !== "string") return null;
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return value;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

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

    const data = createCampaignSchema.parse({
      ...input,
      scheduledAt: normalizeScheduledAt(input.scheduledAt),
    });

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

// ── MODIFIER UNE CAMPAGNE (DRAFT, SCHEDULED, FAILED) ──────────────────────────

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
    if (
      !EDITABLE_STATUSES.includes(existing.status as (typeof EDITABLE_STATUSES)[number])
    ) {
      return {
        success: false,
        error: `Cette campagne (statut "${existing.status}") ne peut plus être modifiée`,
      };
    }

    if (data.name && data.name !== existing.name) {
      const isUnique = await isCampaignNameUnique(data.name, campaignId);
      if (!isUnique) {
        return { success: false, error: "Ce nom est déjà utilisé" };
      }
    }

    if (data.segmentId) {
      const segment = await db.segment.findUnique({
        where: { id: data.segmentId },
        select: { id: true, isActive: true },
      });
      if (!segment) return { success: false, error: "Segment introuvable" };
      if (!segment.isActive) return { success: false, error: "Ce segment est désactivé" };
    }

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

    // Une SCHEDULED sans date redevient DRAFT, une DRAFT/FAILED avec une date
    // devient SCHEDULED, et une FAILED corrigée sans replanification retombe
    // en DRAFT — elle doit être renvoyée manuellement, jamais silencieusement.
    let newStatus: string | undefined;
    if (data.scheduledAt !== undefined) {
      newStatus = data.scheduledAt ? "SCHEDULED" : "DRAFT";
    } else if (existing.status === "FAILED") {
      newStatus = "DRAFT";
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
        ...(newStatus && { status: newStatus as never }),
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

    const result = await sendCampaignCore(data.campaignId, user.id);

    if (result.success && result.data) {
      await createAuditLog(user.id, "campaign.send", data.campaignId, {
        batchId: result.data.batchId,
        queued: result.data.queued,
        estimatedTime: result.data.estimatedTime,
      });
      revalidatePath("/campagnes");
      revalidatePath(`/campagnes/${data.campaignId}`);
    }

    return result;
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

    const raw = input as { campaignId: string; scheduledAt?: unknown };
    const data = scheduleCampaignSchema.parse({
      ...raw,
      scheduledAt: normalizeScheduledAt(raw.scheduledAt),
    });

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

    const rl = await checkRateLimit({
      key: `campaign:duplicate:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("campaigns.create.all");

    const data = duplicateCampaignSchema.parse(input);

    const source = await db.campaign.findUnique({
      where: { id: data.campaignId, deletedAt: null },
    });
    if (!source) return { success: false, error: "Campagne introuvable" };

    // Nom auto-généré "Copie de X" — on ajoute un suffixe numérique tant que
    // le nom n'est pas unique, pour éviter de bloquer la duplication.
    const baseName = `Copie de ${source.name}`.slice(0, 100);
    let newName = baseName;
    let suffix = 2;
    while (!(await isCampaignNameUnique(newName))) {
      newName = `${baseName} (${suffix})`.slice(0, 100);
      suffix++;
    }

    const copy = await db.campaign.create({
      data: {
        name: newName,
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
      newName,
    });

    revalidatePath("/campagnes");
    return { success: true, data: { id: copy.id } };
  } catch (error) {
    logger.error({ error }, "duplicateCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── RELANCER UNE CAMPAGNE ÉCHOUÉE (FAILED → DRAFT) ────────────────────────────
// Retour rapide en brouillon sans repasser par le wizard — pour un renvoi
// immédiat sans correction. "Modifier" reste disponible pour corriger avant.

export async function retryCampaign(campaignId: string): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("campaigns.update.all");

    const campaign = await getCampaignById(campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };

    if (!isTransitionAllowed(campaign.status, "DRAFT")) {
      return {
        success: false,
        error: `Impossible de relancer une campagne en statut "${campaign.status}"`,
      };
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "DRAFT", updatedById: user.id },
    });

    await createAuditLog(user.id, "campaign.retry", campaignId);
    revalidatePath("/campagnes");
    revalidatePath(`/campagnes/${campaignId}`);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "retryCampaign failed");
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

// ── APERÇU EMAIL D'UNE CAMPAGNE ───────────────────────────────────────────────
// Régénère le HTML depuis le template + campaignData persistés en DB (pas de
// données libres venant du client). Utilisé par l'onglet "Email envoyé" de la
// page détail. Génère le HTML via buildEmailHtml() directement (comme le fait
// déjà step-content.tsx dans le wizard) plutôt que via generatePreviewHtml(),
// qui exige en interne "templates.create.all" — un gate non pertinent ici où
// seule la permission "campaigns.read.all" doit être requise.

export async function getEmailPreviewForCampaign(
  campaignId: string
): Promise<Result<{ html: string; subject: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `campaign:preview:${user.id}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("campaigns.read.all");

    const campaign = await getCampaignById(campaignId);
    if (!campaign) return { success: false, error: "Campagne introuvable" };
    if (!campaign.templateId) {
      return { success: false, error: "Aucun template associé à cette campagne" };
    }

    const template = await getTemplateById(campaign.templateId);
    if (!template) return { success: false, error: "Template introuvable" };

    const campaignData = campaign.campaignData;

    const html = buildEmailHtml({
      campaignType: template.category ?? "Promotion",
      productCategory: template.productCategory ?? null,
      subject: template.subject ?? "",
      content: template.content ?? null,
      conclusion: template.conclusion ?? null,
      bannerImageUrl: campaignData?.bannerImageUrl ?? null,
      bannerLinkUrl: campaignData?.bannerLinkUrl ?? null,
      articles: campaignData?.articles ?? [],
      freeImages: campaignData?.freeImages ?? [],
      contentMode: campaignData?.contentMode ?? "articles",
      ctaText: campaignData?.ctaText ?? null,
      ctaUrl: campaignData?.ctaUrl ?? null,
      clientData: DEFAULT_TEST_DATA,
      campaignVars: { ...DEFAULT_CAMPAIGN_VARS, ...campaignData?.campaignVars },
    });

    return {
      success: true,
      data: { html, subject: template.subject ?? "Email sans objet" },
    };
  } catch (error) {
    logger.error({ error, campaignId }, "getEmailPreviewForCampaign failed");
    return { success: false, error: "Erreur lors de la génération de l'aperçu" };
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
