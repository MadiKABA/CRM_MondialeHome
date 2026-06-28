import { z } from "zod";
import { CAMPAIGN_TYPES, PRODUCT_CATEGORIES } from "../types";

// ── Produit dans le template ──────────────────────────────────────────────────

export const templateProductSchema = z
  .object({
    id: z.string().min(1),
    title: z
      .string()
      .min(1, "Le titre du produit est requis")
      .max(100, "Titre trop long"),
    imageUrl: z
      .string()
      .url("URL image invalide")
      .optional()
      .nullable()
      .or(z.literal("")),
    originalPrice: z.coerce
      .number()
      .min(0, "Prix ne peut pas être négatif")
      .optional()
      .nullable(),
    promoPrice: z.coerce.number().min(0).optional().nullable(),
    linkUrl: z.string().url("URL invalide").optional().nullable().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (
        data.promoPrice !== null &&
        data.promoPrice !== undefined &&
        data.originalPrice !== null &&
        data.originalPrice !== undefined
      ) {
        return data.promoPrice < data.originalPrice;
      }
      return true;
    },
    {
      message: "Le prix promotionnel doit être inférieur au prix normal",
      path: ["promoPrice"],
    }
  );

// ── Création / Modification d'un template email ───────────────────────────────

export const createEmailTemplateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Minimum 2 caractères")
      .max(100, "Maximum 100 caractères")
      .trim(),
    description: z.string().max(300).optional().or(z.literal("")),
    language: z.string().default("fr"),

    // Type de campagne → détermine le header
    category: z.enum(CAMPAIGN_TYPES).optional().nullable(),
    productCategory: z.enum(PRODUCT_CATEGORIES).optional().nullable(),

    // Objet de l'email
    subject: z
      .string()
      .min(1, "L'objet de l'email est requis")
      .max(150, "Objet trop long (max 150 caractères)")
      .trim(),

    // Texte prévisualisation dans la boîte mail
    preheader: z.string().max(100, "Maximum 100 caractères").optional().or(z.literal("")),

    // Corps du message
    content: z.string().max(5000).optional().or(z.literal("")),

    // Produits mis en avant (1 à 4)
    products: z.array(templateProductSchema).max(4, "Maximum 4 produits par template"),

    // Conclusion
    conclusion: z.string().max(2000).optional().or(z.literal("")),

    // Bouton principal
    ctaText: z.string().max(60, "Texte bouton trop long").optional().or(z.literal("")),
    ctaUrl: z
      .string()
      .url("URL du bouton invalide")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasUrl = data.ctaUrl && data.ctaUrl.length > 0;
      const hasText = data.ctaText && data.ctaText.length > 0;
      if (hasUrl && !hasText) return false;
      if (hasText && !hasUrl) return false;
      return true;
    },
    {
      message: "Le texte et le lien du bouton doivent être renseignés ensemble",
      path: ["ctaText"],
    }
  )
  .refine(
    (data) => {
      const hasContent = data.content && data.content.trim().length > 0;
      const hasProducts = data.products.length > 0;
      const hasConclusion = data.conclusion && data.conclusion.trim().length > 0;
      return hasContent || hasProducts || hasConclusion;
    },
    {
      message:
        "L'email doit contenir au moins une introduction, un produit ou une conclusion",
      path: ["content"],
    }
  );

// ── Duplication ───────────────────────────────────────────────────────────────

export const duplicateTemplateSchema = z.object({
  templateId: z.string().cuid(),
  newName: z.string().min(2, "Minimum 2 caractères").max(100).trim(),
});

// ── Suppression ───────────────────────────────────────────────────────────────

export const deleteTemplateSchema = z.object({
  templateId: z.string().cuid(),
});

// ── Envoi d'un email test ─────────────────────────────────────────────────────

export const sendTestEmailSchema = z.object({
  templateId: z.string().cuid(),
  toEmail: z.string().min(1, "Email requis").email("Email invalide"),
});

// ── Filtres de liste ──────────────────────────────────────────────────────────

export const templateFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ── Types exportés ────────────────────────────────────────────────────────────

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type DuplicateTemplateInput = z.infer<typeof duplicateTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>;
export type TemplateFilters = z.infer<typeof templateFiltersSchema>;
