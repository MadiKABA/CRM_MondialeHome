"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth/auth";
import { isCampaignNameUnique } from "@/features/campaigns/server/queries";
import { sendCampaignSchema } from "@/features/campaigns/schemas/campaign.schema";
import { getTemplateById } from "@/features/templates/server/queries";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { personalizeSmsMessage } from "@/lib/sms/personalizer";
import { smsConfig } from "@/lib/sms/config";
import {
  createSmsCampaignSchema,
  previewSmsMessageSchema,
  type CreateSmsCampaignInput,
} from "../schemas/sms.schema";
import { sendSmsCampaignCore } from "./service";
import type { SmsCampaignPreview } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function auditLog(
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
        newValue: (meta ?? null) as never,
        ipAddress: h.get("x-forwarded-for") ?? null,
        userAgent: h.get("user-agent") ?? null,
        status: "success",
      },
    });
  } catch {
    // audit ne doit jamais bloquer l'action principale
  }
}

// Normalise un scheduledAt vers ISO complet — même correction que campaigns/server/actions.ts
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

// ── CRÉER UNE CAMPAGNE SMS ─────────────────────────────────────────────────────
// Crée la campagne (status DRAFT) + son CampaignVariant SMS (contenu du message).
// L'envoi effectif (sendSmsCampaign) est une action séparée.

export async function createSmsCampaign(
  input: CreateSmsCampaignInput
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

    const data = createSmsCampaignSchema.parse({
      ...input,
      scheduledAt: normalizeScheduledAt(input.scheduledAt),
    });

    const isUnique = await isCampaignNameUnique(data.name);
    if (!isUnique)
      return { success: false, error: "Une campagne avec ce nom existe déjà" };

    const segment = await db.segment.findUnique({
      where: { id: data.segmentId },
      select: { id: true },
    });
    if (!segment) return { success: false, error: "Segment introuvable" };

    if (data.templateId) {
      const template = await db.template.findUnique({
        where: { id: data.templateId },
        select: { id: true, channel: true, isActive: true },
      });
      if (!template) return { success: false, error: "Template introuvable" };
      if (template.channel !== "SMS")
        return { success: false, error: "Ce template n'est pas un template SMS" };
      if (!template.isActive)
        return { success: false, error: "Ce template est désactivé" };
    }

    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
        type: "MANUAL",
        segmentId: data.segmentId,
        audienceType: "SEGMENT",
        channels: ["SMS"],
        smsCampaignData: {
          produit: data.campaignVars.produit || null,
          reduction: data.campaignVars.reduction || null,
        },
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: user.id,
        variants: {
          create: {
            name: "SMS",
            channel: "SMS",
            content: data.content,
            templateId: data.templateId ?? null,
            senderId: smsConfig.phoneNumber,
          },
        },
      },
    });

    await auditLog(user.id, "campaign.create", campaign.id, {
      name: campaign.name,
      segmentId: campaign.segmentId,
      channel: "SMS",
    });

    revalidatePath("/campagnes");
    return { success: true, data: { id: campaign.id } };
  } catch (error) {
    logger.error({ error }, "createSmsCampaign failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ENVOYER UNE CAMPAGNE SMS ──────────────────────────────────────────────────
// Récupère les clients éligibles (smsConsent + téléphone), passe la campagne en
// SENDING et enqueue le batch dans la queue BullMQ "sms-send" (traité par le
// worker SMS — voir src/server/workers/sms.worker.ts).

export async function sendSmsCampaign(
  input: unknown
): Promise<Result<{ queued: number; estimatedTime: number }>> {
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

    const result = await sendSmsCampaignCore(data.campaignId, user.id);

    if (result.success && result.data) {
      await auditLog(user.id, "campaign.send", data.campaignId, {
        channel: "SMS",
        queued: result.data.queued,
      });
      revalidatePath("/campagnes");
      revalidatePath(`/campagnes/${data.campaignId}`);
    }

    return result;
  } catch (error) {
    logger.error({ error }, "sendSmsCampaign failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}

// ── PRÉVISUALISER UN MESSAGE SMS ──────────────────────────────────────────────
// Rate limit strict — appelé potentiellement à chaque frappe côté client.

export async function previewSmsMessage(
  input: unknown
): Promise<Result<SmsCampaignPreview>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `sms:preview:${user.id}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    const data = previewSmsMessageSchema.parse(input);

    const template = await getTemplateById(data.templateId);
    if (!template) return { success: false, error: "Template introuvable" };
    if (template.channel !== "SMS")
      return { success: false, error: "Ce template n'est pas un template SMS" };

    const content = template.content ?? "";
    const messagePreview = personalizeSmsMessage(
      content,
      { firstName: "Mamadou" },
      {
        produit: data.campaignVars.produit || "Canapé Oslo",
        reduction: data.campaignVars.reduction || "20",
      }
    );

    return {
      success: true,
      data: { messagePreview, analysis: analyzeMessage(content) },
    };
  } catch (error) {
    logger.error({ error }, "previewSmsMessage failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}
