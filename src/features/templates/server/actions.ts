"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type TemplateCategory } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_CONFIG } from "@/lib/email/config";
import { buildEmailHtml } from "../lib/html-builder";
import {
  extractAllTemplateVariables,
  DEFAULT_CLIENT_DATA,
  DEFAULT_CAMPAIGN_VARS,
} from "../lib/renderer";
import { validateTemplateVariables } from "../lib/variables";
import {
  createEmailTemplateSchema,
  duplicateTemplateSchema,
  deleteTemplateSchema,
  sendTestEmailSchema,
  previewTemplateSchema,
  type CreateEmailTemplateInput,
} from "../schemas/template.schema";
import { isTemplateNameUnique, getTemplateById, getArticlesForTemplate } from "./queries";
import type { CampaignArticle } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        entity: "Template",
        entityId: entityId ?? null,
        newValue: (meta ?? null) as Parameters<
          typeof db.auditLog.create
        >[0]["data"]["newValue"],
        ipAddress: h.get("x-forwarded-for") ?? null,
        userAgent: h.get("user-agent") ?? null,
        status: "success",
      },
    });
  } catch {
    // audit ne doit jamais bloquer l'action principale
  }
}

function toPrismaCategory(campaignType: string | null | undefined): TemplateCategory {
  const map: Record<string, TemplateCategory> = {
    Promotion: "PROMOTION",
    Arrivage: "NEW_ARRIVAL",
    Fidélisation: "THANK_YOU",
    Relance: "REACTIVATION",
    Événement: "EVENT",
    Transactionnel: "ANNOUNCEMENT",
  };
  return campaignType ? (map[campaignType] ?? "OTHER") : "OTHER";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── CRÉER UN TEMPLATE ─────────────────────────────────────────────────────────

export async function createEmailTemplate(
  input: CreateEmailTemplateInput
): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `template:create:${user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed)
      return { success: false, error: "Trop de requêtes. Attendez une minute." };

    await checkPermission("templates.create.all");

    const data = createEmailTemplateSchema.parse(input);

    const isUnique = await isTemplateNameUnique(data.name);
    if (!isUnique)
      return { success: false, error: "Un template avec ce nom existe déjà" };

    const varValidation = validateTemplateVariables([
      data.subject,
      data.content,
      data.conclusion,
    ]);
    if (!varValidation.valid) {
      return {
        success: false,
        error: `Variables inconnues : ${varValidation.unknown.join(", ")}`,
      };
    }

    const variables = extractAllTemplateVariables({
      subject: data.subject,
      content: data.content,
      conclusion: data.conclusion,
    });

    let slug = generateSlug(data.name);
    const existing = await db.template.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) slug = `${slug}-${Date.now()}`;

    const template = await db.template.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || null,
        channel: "EMAIL",
        category: toPrismaCategory(data.category),
        campaignType: data.category ?? null,
        productCategory: data.productCategory ?? null,
        language: data.language,
        subject: data.subject,
        preheader: data.preheader || null,
        content: data.content || null,
        conclusion: data.conclusion || null,
        variables,
        isActive: true,
        isSystem: false,
        createdById: user.id,
      },
    });

    await auditLog(user.id, "template.create", template.id, {
      name: template.name,
      campaignType: data.category,
    });

    revalidatePath("/templates");
    return { success: true, data: { id: template.id } };
  } catch (error) {
    logger.error({ error }, "createEmailTemplate failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── MODIFIER UN TEMPLATE ──────────────────────────────────────────────────────

export async function updateEmailTemplate(
  templateId: string,
  input: CreateEmailTemplateInput
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `template:update:${user.id}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("templates.update.all");

    const data = createEmailTemplateSchema.parse(input);

    const existing = await db.template.findUnique({
      where: { id: templateId },
      select: { isSystem: true, channel: true },
    });
    if (!existing) return { success: false, error: "Template introuvable" };
    if (existing.isSystem)
      return {
        success: false,
        error: "Les templates système ne peuvent pas être modifiés",
      };
    if (existing.channel !== "EMAIL")
      return { success: false, error: "Ce template n'est pas un template email" };

    const isUnique = await isTemplateNameUnique(data.name, templateId);
    if (!isUnique)
      return { success: false, error: "Un template avec ce nom existe déjà" };

    const varValidation = validateTemplateVariables([
      data.subject,
      data.content,
      data.conclusion,
    ]);
    if (!varValidation.valid) {
      return {
        success: false,
        error: `Variables inconnues : ${varValidation.unknown.join(", ")}`,
      };
    }

    const variables = extractAllTemplateVariables({
      subject: data.subject,
      content: data.content,
      conclusion: data.conclusion,
    });

    await db.template.update({
      where: { id: templateId },
      data: {
        name: data.name.trim(),
        description: data.description || null,
        category: toPrismaCategory(data.category),
        campaignType: data.category ?? null,
        productCategory: data.productCategory ?? null,
        language: data.language,
        subject: data.subject,
        preheader: data.preheader || null,
        content: data.content || null,
        conclusion: data.conclusion || null,
        variables,
      },
    });

    await auditLog(user.id, "template.update", templateId);
    revalidatePath("/templates");
    revalidatePath(`/templates/${templateId}`);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "updateEmailTemplate failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── DUPLIQUER ─────────────────────────────────────────────────────────────────

export async function duplicateTemplate(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("templates.create.all");

    const data = duplicateTemplateSchema.parse(input);

    const source = await db.template.findUnique({ where: { id: data.templateId } });
    if (!source) return { success: false, error: "Template introuvable" };

    const isUnique = await isTemplateNameUnique(data.newName);
    if (!isUnique)
      return { success: false, error: "Un template avec ce nom existe déjà" };

    let slug = generateSlug(data.newName);
    const existingSlug = await db.template.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const copy = await db.template.create({
      data: {
        name: data.newName.trim(),
        slug,
        description: source.description,
        channel: "EMAIL",
        category: source.category,
        campaignType: source.campaignType,
        productCategory: source.productCategory,
        language: source.language,
        subject: source.subject,
        preheader: source.preheader,
        content: source.content,
        conclusion: source.conclusion,
        variables: source.variables,
        isActive: true,
        isSystem: false,
        createdById: user.id,
      },
    });

    await auditLog(user.id, "template.duplicate", copy.id, {
      sourceId: source.id,
      newName: data.newName,
    });

    revalidatePath("/templates");
    return { success: true, data: { id: copy.id } };
  } catch (error) {
    logger.error({ error }, "duplicateTemplate failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── SUPPRIMER ─────────────────────────────────────────────────────────────────

export async function deleteTemplate(input: unknown): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("templates.delete.all");

    const data = deleteTemplateSchema.parse(input);

    const template = await db.template.findUnique({
      where: { id: data.templateId },
      select: { name: true, isSystem: true },
    });
    if (!template) return { success: false, error: "Template introuvable" };
    if (template.isSystem)
      return {
        success: false,
        error: "Les templates système ne peuvent pas être supprimés",
      };

    await db.template.delete({ where: { id: data.templateId } });

    await auditLog(user.id, "template.delete", data.templateId, { name: template.name });

    revalidatePath("/templates");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "deleteTemplate failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── TOGGLE ACTIF / INACTIF ────────────────────────────────────────────────────

export async function toggleTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("templates.update.all");

    const template = await db.template.findUnique({
      where: { id: templateId },
      select: { isSystem: true },
    });
    if (!template) return { success: false, error: "Template introuvable" };

    await db.template.update({ where: { id: templateId }, data: { isActive } });

    revalidatePath("/templates");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "toggleTemplateActive failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ENVOYER UN EMAIL DE TEST ──────────────────────────────────────────────────
// Simule une vraie campagne : articles depuis le catalogue M2, CTA et vars de campagne.

export async function sendTestEmail(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `template:send_test:${user.id}`,
      limit: 5,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return { success: false, error: "Trop d'emails de test. Attendez une minute." };
    }

    await checkPermission("templates.update.all");

    const data = sendTestEmailSchema.parse(input);

    const template = await getTemplateById(data.templateId);
    if (!template) return { success: false, error: "Template introuvable" };
    if (!template.subject)
      return { success: false, error: "L'objet de l'email est manquant" };

    const articleIds = data.articleIds ?? [];
    const articles =
      articleIds.length > 0 ? await getArticlesForTemplate(articleIds) : [];

    const html = buildEmailHtml({
      campaignType: template.category ?? "Promotion",
      productCategory: template.productCategory ?? null,
      subject: template.subject,
      content: template.content,
      conclusion: template.conclusion,
      bannerImageUrl: data.bannerImageUrl || null,
      articles,
      ctaText: data.ctaText || null,
      ctaUrl: data.ctaUrl || null,
      clientData: DEFAULT_CLIENT_DATA,
      campaignVars: {
        ...DEFAULT_CAMPAIGN_VARS,
        ...(data.campaignVars ?? {}),
      },
    });

    const resend = getResendClient();
    const { data: resendData, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.formatted,
      to: [data.toEmail],
      subject: `[TEST] ${template.subject}`,
      html,
    });

    if (error) {
      logger.error({ error }, "sendTestEmail Resend error");
      return { success: false, error: `Erreur Resend : ${error.message}` };
    }

    logger.info({ id: resendData?.id, to: data.toEmail }, "Test email sent");

    await auditLog(user.id, "template.test_sent", data.templateId, {
      to: data.toEmail,
      articleIds: articleIds,
      hasCtaUrl: !!data.ctaUrl,
      hasBanner: !!data.bannerImageUrl,
    });

    return { success: true, data: { id: resendData?.id ?? "" } };
  } catch (error) {
    logger.error({ error }, "sendTestEmail failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}

// ── GÉNÉRER LE HTML DE PRÉVISUALISATION ───────────────────────────────────────
// Appelée en temps réel depuis le formulaire (debounce 800ms).

export async function generatePreviewHtml(
  input: unknown
): Promise<Result<{ html: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `template:preview:${user.id}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    await checkPermission("templates.create.all");

    const data = previewTemplateSchema.parse(input);

    const html = buildEmailHtml({
      campaignType: data.templateData.category ?? "Promotion",
      productCategory: data.templateData.productCategory ?? null,
      subject: data.templateData.subject ?? "",
      content: data.templateData.content ?? null,
      conclusion: data.templateData.conclusion ?? null,
      bannerImageUrl: data.bannerImageUrl || null,
      articles: (data.previewArticles ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        reference: a.reference,
        price: a.price,
        promoPrice: a.promoPrice ?? null,
        mainImage: a.mainImage || null,
        linkUrl: a.linkUrl || null,
      })),
      ctaText: data.ctaText || null,
      ctaUrl: data.ctaUrl || null,
      clientData: DEFAULT_CLIENT_DATA,
      campaignVars: DEFAULT_CAMPAIGN_VARS,
    });

    return { success: true, data: { html } };
  } catch (error) {
    logger.error({ error }, "generatePreviewHtml failed");
    return { success: false, error: "Erreur de prévisualisation" };
  }
}

// ── RECHERCHE D'ARTICLES POUR LA PRÉVISUALISATION ────────────────────────────
// Utilisée dans ArticlePicker du CampaignPreviewPanel (simulation côté formulaire).

export async function searchArticlesForPreview(
  search: string,
  excludeIds: string[]
): Promise<Result<CampaignArticle[]>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission("templates.create.all");

    const articles = await db.article.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["ARCHIVED", "DISCONTINUED"] },
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        ...(search.trim() && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        reference: true,
        price: true,
        mainImage: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: articles.map((a) => ({
        id: a.id,
        name: a.name,
        reference: a.reference,
        price: Number(a.price),
        mainImage: a.mainImage ?? null,
        linkUrl: null,
      })),
    };
  } catch (error) {
    logger.error({ error }, "searchArticlesForPreview failed");
    return { success: false, error: "Erreur de recherche" };
  }
}

// ── SEED — Templates de démo ──────────────────────────────────────────────────

export async function seedEmailTemplates(): Promise<void> {
  const templates = [
    {
      name: "Promo Soldes Salon",
      description: "Template promotion pour les meubles de salon",
      campaignType: "Promotion" as const,
      productCategory: "Salon / Canapés",
      subject: "🎁 {{prenom}}, -{{reduction}} sur nos canapés ce weekend !",
      preheader: "Offre valable jusqu'au {{date_expiration}} seulement",
      content:
        "Bonjour {{prenom}} 👋\n\nNous avons une offre exceptionnelle sur notre collection salon. Profitez de -{{reduction}} sur une sélection de canapés et tables basses.",
      conclusion:
        "Offre valable jusqu'au {{date_expiration}}.\nCode promo : {{code_promo}}\n\nÀ très bientôt chez Mondial Home,\nL'équipe {{nom_boutique}}",
    },
    {
      name: "Arrivage Nouveaux Canapés",
      description: "Annonce d'arrivage de nouveaux canapés",
      campaignType: "Arrivage" as const,
      productCategory: "Salon / Canapés",
      subject: "🛋️ {{prenom}}, de nouveaux canapés viennent d'arriver !",
      preheader: "Découvrez notre nouvelle collection salon",
      content:
        "Bonjour {{prenom}} 👋\n\nBonne nouvelle ! Notre nouvelle collection de canapés vient d'arriver en boutique. Des styles modernes, du confort garanti.",
      conclusion:
        "Venez nous rendre visite à {{adresse_boutique}}.\n\nL'équipe {{nom_boutique}}",
    },
    {
      name: "Relance Client Inactif",
      description: "Email de relance pour les clients inactifs depuis 90 jours",
      campaignType: "Relance" as const,
      productCategory: null,
      subject: "💛 {{prenom}}, vous nous manquez !",
      preheader: "Une offre spéciale vous attend",
      content:
        "Bonjour {{prenom}} 👋\n\nCela fait un moment qu'on ne vous a pas vu chez Mondial Home. Pour marquer votre retour, nous vous offrons -{{reduction}} sur votre prochain achat.\n\nCode : {{code_promo}}",
      conclusion:
        "Offre valable jusqu'au {{date_expiration}}.\n\nÀ très bientôt,\nL'équipe {{nom_boutique}}",
    },
    {
      name: "Offre VIP Exclusive",
      description: "Email réservé aux clients VIP et champions",
      campaignType: "Fidélisation" as const,
      productCategory: null,
      subject: "⭐ {{prenom}}, votre offre VIP exclusive vous attend",
      preheader: "Réservée à nos meilleurs clients",
      content:
        "Bonjour {{prenom}} ⭐\n\nEn tant que client privilégié de Mondial Home, vous bénéficiez d'une offre exclusive : -{{reduction}} sur l'ensemble de notre catalogue.\n\nVotre fidélité mérite d'être récompensée.",
      conclusion:
        "Code exclusif : {{code_promo}}\nValable jusqu'au {{date_expiration}}\n\nAvec toute notre gratitude,\nL'équipe {{nom_boutique}}",
    },
    {
      name: "Arrivage Collection Chambre",
      description: "Annonce d'arrivage de mobilier de chambre",
      campaignType: "Arrivage" as const,
      productCategory: "Chambre / Lits",
      subject: "🛏️ {{prenom}}, notre collection chambre est arrivée !",
      preheader: "Lits, armoires, tables de chevet...",
      content:
        "Bonjour {{prenom}} 👋\n\nNotre nouvelle collection chambre vient d'arriver chez Mondial Home ! Lits confortables, armoires spacieuses... De quoi transformer votre chambre.",
      conclusion:
        "Venez découvrir toute la collection à {{adresse_boutique}}.\n\nÀ bientôt,\nL'équipe {{nom_boutique}}",
    },
  ];

  for (const tmpl of templates) {
    const existing = await db.template.findFirst({
      where: { name: tmpl.name, channel: "EMAIL" },
      select: { id: true },
    });
    if (existing) continue;

    const variables = extractAllTemplateVariables({
      subject: tmpl.subject,
      content: tmpl.content,
      conclusion: tmpl.conclusion,
    });

    let slug = generateSlug(tmpl.name);
    const existingSlug = await db.template.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    await db.template.create({
      data: {
        name: tmpl.name,
        slug,
        description: tmpl.description,
        channel: "EMAIL",
        category: toPrismaCategory(tmpl.campaignType),
        campaignType: tmpl.campaignType,
        productCategory: tmpl.productCategory ?? null,
        language: "fr",
        subject: tmpl.subject,
        preheader: tmpl.preheader ?? null,
        content: tmpl.content,
        conclusion: tmpl.conclusion,
        variables,
        isActive: true,
        isSystem: true,
      },
    });
  }

  console.log("✅ Templates email seedés (5 templates système)");
}
