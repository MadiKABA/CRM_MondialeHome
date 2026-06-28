import { z } from "zod";
import { CAMPAIGN_TYPES, PRODUCT_CATEGORIES } from "../types";

// ── Création / Modification d'un template ────────────────────────────────────
// Le template ne stocke QUE la structure réutilisable.
// Pas de produits, pas de CTA → fournis par la campagne.

export const createEmailTemplateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Minimum 2 caractères")
      .max(100, "Maximum 100 caractères")
      .trim(),
    description: z
      .string()
      .max(300, "Maximum 300 caractères")
      .optional()
      .or(z.literal("")),
    language: z.string().min(1),

    category: z.enum(CAMPAIGN_TYPES).optional().nullable(),
    productCategory: z.enum(PRODUCT_CATEGORIES).optional().nullable(),

    subject: z
      .string()
      .min(1, "L'objet est requis")
      .max(150, "Maximum 150 caractères")
      .trim(),

    preheader: z.string().max(100, "Maximum 100 caractères").optional().or(z.literal("")),

    content: z
      .string()
      .max(5000, "Introduction trop longue")
      .optional()
      .or(z.literal("")),
    conclusion: z
      .string()
      .max(2000, "Conclusion trop longue")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasContent = !!data.content?.trim();
      const hasConclusion = !!data.conclusion?.trim();
      return hasContent || hasConclusion;
    },
    {
      message: "Le template doit contenir au moins une introduction ou une conclusion",
      path: ["content"],
    }
  );

// ── Prévisualisation (dans le formulaire) ─────────────────────────────────────
// Accepte des articles et CTA simulés pour reproduire une vraie campagne.

export const previewTemplateSchema = z.object({
  templateData: createEmailTemplateSchema,

  bannerImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  ctaText: z.string().max(60).optional().or(z.literal("")),
  ctaUrl: z.string().url().optional().nullable().or(z.literal("")),

  previewArticles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        reference: z.string(),
        price: z.number().min(0),
        promoPrice: z.number().min(0).optional().nullable(),
        mainImage: z.string().url().optional().nullable().or(z.literal("")),
        linkUrl: z.string().url().optional().nullable().or(z.literal("")),
      })
    )
    .max(4)
    .default([]),
});

// ── Duplication ───────────────────────────────────────────────────────────────

export const duplicateTemplateSchema = z.object({
  templateId: z.string().cuid(),
  newName: z.string().min(2, "Minimum 2 caractères").max(100).trim(),
});

// ── Suppression ───────────────────────────────────────────────────────────────

export const deleteTemplateSchema = z.object({
  templateId: z.string().cuid(),
});

// ── Envoi d'un email test (simule une vraie campagne) ─────────────────────────

export const sendTestEmailSchema = z
  .object({
    templateId: z.string().cuid(),
    toEmail: z.string().email("Email invalide"),

    bannerImageUrl: z
      .string()
      .url("URL bannière invalide")
      .optional()
      .nullable()
      .or(z.literal("")),

    articleIds: z.array(z.string().cuid()).max(4, "Maximum 4 articles").optional(),

    ctaText: z.string().max(60).optional().or(z.literal("")),
    ctaUrl: z.string().url("URL CTA invalide").optional().nullable().or(z.literal("")),

    campaignVars: z.record(z.string()).optional(),
  })
  .refine(
    (data) => {
      const hasText = !!data.ctaText?.trim();
      const hasUrl = !!data.ctaUrl?.trim();
      if (hasText && !hasUrl) return false;
      if (hasUrl && !hasText) return false;
      return true;
    },
    {
      message: "Texte et lien du bouton doivent être renseignés ensemble",
      path: ["ctaText"],
    }
  );

// ── Filtres ───────────────────────────────────────────────────────────────────

export const templateFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ── Types exportés ────────────────────────────────────────────────────────────

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;
export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>;
export type DuplicateTemplateInput = z.infer<typeof duplicateTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type TemplateFilters = z.infer<typeof templateFiltersSchema>;
