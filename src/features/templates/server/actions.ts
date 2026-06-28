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
import { extractAllTemplateVariables, DEFAULT_TEST_DATA } from "../lib/renderer";
import { validateTemplateVariables } from "../lib/variables";
import {
  createEmailTemplateSchema,
  duplicateTemplateSchema,
  deleteTemplateSchema,
  sendTestEmailSchema,
  type CreateEmailTemplateInput,
} from "../schemas/template.schema";
import { isTemplateNameUnique, getTemplateById } from "./queries";
import type { TemplateProduct } from "../types";

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
    // Ne pas faire échouer l'action principale si l'audit plante
  }
}

// Mapping CampaignType → TemplateCategory enum Prisma
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

// Génère un slug unique à partir du nom
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── CRÉER UN TEMPLATE EMAIL ───────────────────────────────────────────────────

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
      data.ctaText,
    ]);
    if (!varValidation.valid) {
      return {
        success: false,
        error: `Variables inconnues : ${varValidation.unknown.join(", ")}`,
      };
    }

    for (const product of data.products) {
      if (product.imageUrl && !product.imageUrl.startsWith("https://")) {
        return {
          success: false,
          error: `Image du produit "${product.title}" : URL invalide (doit commencer par https://)`,
        };
      }
    }

    const variables = extractAllTemplateVariables({
      subject: data.subject,
      content: data.content,
      conclusion: data.conclusion,
      ctaText: data.ctaText,
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
        products: data.products as TemplateProduct[] as unknown as Parameters<
          typeof db.template.create
        >[0]["data"]["products"],
        ctaText: data.ctaText || null,
        ctaUrl: data.ctaUrl || null,
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

// ── MODIFIER UN TEMPLATE EMAIL ────────────────────────────────────────────────

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
      data.ctaText,
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
      ctaText: data.ctaText,
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
        products: data.products as TemplateProduct[] as unknown as Parameters<
          typeof db.template.update
        >[0]["data"]["products"],
        ctaText: data.ctaText || null,
        ctaUrl: data.ctaUrl || null,
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
        products: source.products as Parameters<
          typeof db.template.create
        >[0]["data"]["products"],
        ctaText: source.ctaText,
        ctaUrl: source.ctaUrl,
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

    const html = buildEmailHtml({
      campaignType: template.category ?? "Promotion",
      productCategory: template.productCategory ?? null,
      subject: template.subject,
      content: template.content,
      conclusion: template.conclusion,
      products: template.products,
      ctaText: template.ctaText,
      ctaUrl: template.ctaUrl,
      testData: DEFAULT_TEST_DATA,
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

    await auditLog(user.id, "template.test_sent", data.templateId, { to: data.toEmail });

    return { success: true, data: { id: resendData?.id ?? "" } };
  } catch (error) {
    logger.error({ error }, "sendTestEmail failed");
    return { success: false, error: "Une erreur est survenue lors de l'envoi" };
  }
}

// ── GÉNÈRER LE HTML D'APERÇU ──────────────────────────────────────────────────

export async function generatePreviewHtml(
  input: CreateEmailTemplateInput
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

    const html = buildEmailHtml({
      campaignType: input.category ?? "Promotion",
      productCategory: input.productCategory ?? null,
      subject: input.subject ?? "",
      content: input.content ?? null,
      conclusion: input.conclusion ?? null,
      products: (input.products ?? []) as TemplateProduct[],
      ctaText: input.ctaText ?? null,
      ctaUrl: input.ctaUrl ?? null,
      testData: DEFAULT_TEST_DATA,
    });

    return { success: true, data: { html } };
  } catch (error) {
    logger.error({ error }, "generatePreviewHtml failed");
    return { success: false, error: "Erreur de prévisualisation" };
  }
}

// ── SEED — Templates de démo ──────────────────────────────────────────────────

export async function seedEmailTemplates(): Promise<void> {
  const templates = [
    {
      name: "Promo Soldes Salon",
      description: "Template pour les promotions sur les meubles de salon",
      campaignType: "Promotion" as const,
      productCategory: "Salon / Canapés",
      subject: "🎁 {{prenom}}, -{{reduction}} sur nos canapés ce weekend !",
      preheader: "Offre valable jusqu'au {{date_expiration}} seulement",
      content:
        "Bonjour {{prenom}} 👋\n\nNous avons une offre exceptionnelle pour vous sur notre collection salon. Profitez de -{{reduction}} sur une sélection de canapés, tables basses et plus encore.",
      conclusion:
        "Offre valable jusqu'au {{date_expiration}}.\n\nÀ très bientôt chez Mondial Home,\nL'équipe {{nom_boutique}}",
      ctaText: "Voir toute la collection",
      ctaUrl: "https://mondialhome.sn/salon",
    },
    {
      name: "Arrivage Nouveaux Canapés",
      description: "Annonce d'arrivage de nouveaux canapés",
      campaignType: "Arrivage" as const,
      productCategory: "Salon / Canapés",
      subject: "🛋️ {{prenom}}, de nouveaux canapés viennent d'arriver !",
      preheader: "Découvrez notre nouvelle collection salon",
      content:
        "Bonjour {{prenom}} 👋\n\nBonne nouvelle ! Notre nouvelle collection de canapés vient d'arriver en boutique. Des styles modernes, du confort garanti, aux meilleurs prix de Dakar.",
      conclusion:
        "Venez nous rendre visite à {{adresse_boutique}}.\n\nL'équipe {{nom_boutique}}",
      ctaText: "Découvrir la collection",
      ctaUrl: "https://mondialhome.sn/canapes",
    },
    {
      name: "Relance Client Inactif",
      description: "Email de relance pour les clients inactifs depuis 90 jours",
      campaignType: "Relance" as const,
      productCategory: null,
      subject: "💛 {{prenom}}, vous nous manquez !",
      preheader: "Voici une offre spéciale pour votre retour",
      content:
        "Bonjour {{prenom}} 👋\n\nCela fait un moment qu'on ne vous a pas vu chez Mondial Home. Vous nous manquez !\n\nPour marquer vos retrouvailles, nous vous offrons -{{reduction}} sur votre prochain achat. Il vous suffit de mentionner le code {{code_promo}} en caisse.",
      conclusion:
        "Offre valable jusqu'au {{date_expiration}}.\n\nÀ très bientôt,\nL'équipe {{nom_boutique}}",
      ctaText: "Profiter de l'offre",
      ctaUrl: "https://mondialhome.sn",
    },
    {
      name: "Offre VIP Exclusive",
      description: "Email réservé aux clients VIP et champions",
      campaignType: "Fidélisation" as const,
      productCategory: null,
      subject: "⭐ {{prenom}}, votre offre VIP exclusive vous attend",
      preheader: "Réservée à nos meilleurs clients",
      content:
        "Bonjour {{prenom}} ⭐\n\nEn tant que client privilégié de Mondial Home, vous bénéficiez d'une offre exclusive : -{{reduction}} sur l'ensemble de notre catalogue.\n\nVotre fidélité mérite d'être récompensée. Merci pour votre confiance depuis le début.",
      conclusion:
        "Code exclusif : {{code_promo}}\nValable jusqu'au {{date_expiration}}\n\nAvec toute notre gratitude,\nL'équipe {{nom_boutique}}",
      ctaText: "Profiter de mon avantage VIP",
      ctaUrl: "https://mondialhome.sn/vip",
    },
    {
      name: "Arrivage Collection Chambre",
      description: "Annonce d'arrivage de mobilier de chambre",
      campaignType: "Arrivage" as const,
      productCategory: "Chambre / Lits",
      subject: "🛏️ {{prenom}}, notre collection chambre est arrivée !",
      preheader: "Lits, armoires, tables de chevet...",
      content:
        "Bonjour {{prenom}} 👋\n\nNotre nouvelle collection chambre vient d'arriver chez Mondial Home ! Lits confortables, armoires spacieuses, tables de chevet élégantes... De quoi transformer votre chambre en havre de paix.",
      conclusion:
        "Venez découvrir toute la collection à {{adresse_boutique}}.\n\nÀ bientôt,\nL'équipe {{nom_boutique}}",
      ctaText: "Voir la collection chambre",
      ctaUrl: "https://mondialhome.sn/chambre",
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
      ctaText: tmpl.ctaText,
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
        ctaText: tmpl.ctaText ?? null,
        ctaUrl: tmpl.ctaUrl ?? null,
        variables,
        isActive: true,
        isSystem: true,
      },
    });
  }
}
