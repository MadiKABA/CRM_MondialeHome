"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CONFIG } from "@/lib/email/config";
import { getTemplateById } from "@/features/templates/server/queries";
import { getEmailBatchById } from "./queries";
import { emailQueue } from "@/server/workers/email.worker";
import { personalizeEmail, checkClientEligibility } from "../lib/personalizer";
import { sendEmailToSegmentCore } from "./service";
import type {
  SendEmailBatchInput,
  SendEmailToClientInput,
  SendEmailResult,
  EmailCampaignData,
} from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// ── Validation Zod ────────────────────────────────────────────────────────────

const campaignArticleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  reference: z.string(),
  price: z.number().min(0),
  promoPrice: z.number().min(0).optional().nullable(),
  mainImage: z.string().url().optional().nullable().or(z.literal("")),
  linkUrl: z.string().url().optional().nullable().or(z.literal("")),
});

const campaignDataSchema = z.object({
  articles: z.array(campaignArticleSchema).max(4),
  ctaText: z.string().max(60).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable().or(z.literal("")),
  bannerImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  campaignVars: z.record(z.string()).default({}),
});

const sendEmailBatchSchema = z.object({
  templateId: z.string().cuid(),
  segmentId: z.string().cuid(),
  campaignData: campaignDataSchema,
});

const sendEmailToClientSchema = z.object({
  templateId: z.string().cuid(),
  clientId: z.string().cuid(),
  campaignData: campaignDataSchema,
});

// Normalise les champs optionnels Zod (undefined → null) pour correspondre à EmailCampaignData
function normalizeCampaignData(
  raw: z.infer<typeof campaignDataSchema>
): EmailCampaignData {
  return {
    articles: raw.articles.map((a) => ({
      ...a,
      promoPrice: a.promoPrice ?? null,
      mainImage: a.mainImage || null,
      linkUrl: a.linkUrl || null,
    })),
    ctaText: raw.ctaText ?? null,
    ctaUrl: raw.ctaUrl || null,
    bannerImageUrl: raw.bannerImageUrl || null,
    campaignVars: raw.campaignVars,
  };
}

// ── ENVOYER À UN SEGMENT ──────────────────────────────────────────────────────

export async function sendEmailToSegment(
  input: SendEmailBatchInput
): Promise<Result<SendEmailResult>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `email:batch:${user.id}`,
      limit: 3,
      windowMs: 300_000,
    });
    if (!rl.allowed) {
      return {
        success: false,
        error: "Trop d'envois. Attendez 5 minutes entre chaque campagne.",
      };
    }

    await checkPermission("templates.read.all");

    const data = sendEmailBatchSchema.parse(input);

    return sendEmailToSegmentCore(
      {
        templateId: data.templateId,
        segmentId: data.segmentId,
        campaignData: normalizeCampaignData(data.campaignData),
      },
      user.id
    );
  } catch (error) {
    logger.error({ error }, "sendEmailToSegment failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ENVOYER À UN SEUL CLIENT ──────────────────────────────────────────────────

export async function sendEmailToClient(
  input: SendEmailToClientInput
): Promise<Result<{ messageId: string; resendId: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `email:single:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("templates.read.all");

    const data = sendEmailToClientSchema.parse(input);

    const template = await getTemplateById(data.templateId);
    if (!template || !template.isActive) {
      return { success: false, error: "Template introuvable ou inactif" };
    }

    const client = await db.client.findUnique({
      where: { id: data.clientId, deletedAt: null },
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

    if (!client) return { success: false, error: "Client introuvable" };

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
      return { success: false, error: `Client non éligible : ${eligibility.reason}` };
    }

    const personalizedEmail = personalizeEmail(
      clientData,
      template,
      normalizeCampaignData(data.campaignData)
    );

    const messageLog = await db.messageLog.create({
      data: {
        templateId: data.templateId,
        clientId: client.id,
        email: personalizedEmail.to,
        status: "PENDING",
      },
    });

    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.formatted,
      to: [personalizedEmail.to],
      subject: personalizedEmail.subject,
      html: personalizedEmail.html,
    });

    if (error) {
      await db.messageLog.update({
        where: { id: messageLog.id },
        data: { status: "FAILED", errorMessage: error.message },
      });
      return { success: false, error: `Erreur Resend : ${error.message}` };
    }

    await db.messageLog.update({
      where: { id: messageLog.id },
      data: { status: "SENT", resendId: resendData?.id ?? null, sentAt: new Date() },
    });

    return {
      success: true,
      data: { messageId: messageLog.id, resendId: resendData?.id ?? "" },
    };
  } catch (error) {
    logger.error({ error }, "sendEmailToClient failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ANNULER UN BATCH EN COURS ─────────────────────────────────────────────────

export async function cancelEmailBatch(batchId: string): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("templates.update.all");

    const batch = await db.emailBatch.findUnique({
      where: { id: batchId },
      select: { status: true },
    });

    if (!batch) return { success: false, error: "Batch introuvable" };
    if (!["PENDING", "PROCESSING"].includes(batch.status)) {
      return { success: false, error: "Ce batch ne peut plus être annulé" };
    }

    await db.emailBatch.update({
      where: { id: batchId },
      data: { status: "CANCELLED", completedAt: new Date() },
    });

    if (emailQueue) {
      const jobs = await emailQueue.getJobs(["waiting", "delayed"]);
      for (const job of jobs) {
        if (job.data?.batchId === batchId) {
          await job.remove();
        }
      }
    }

    revalidatePath("/emails");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "cancelEmailBatch failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── STATS EN TEMPS RÉEL D'UN BATCH ───────────────────────────────────────────

export async function getEmailBatchStats(
  batchId: string
): Promise<Result<Awaited<ReturnType<typeof getEmailBatchById>>>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `email:stats:${user.id}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("templates.read.all");

    const batch = await getEmailBatchById(batchId);
    if (!batch) return { success: false, error: "Batch introuvable" };

    return { success: true, data: batch };
  } catch (error) {
    logger.error({ error }, "getEmailBatchStats failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}
