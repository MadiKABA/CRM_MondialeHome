import { z } from "zod";

// Toute image de campagne passe par notre route d'upload Cloudinary signée
// (voir /api/upload/campaign-image) — on rejette donc toute URL qui ne vient
// pas de ce domaine pour éviter qu'un client envoie une URL arbitraire.
function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("res.cloudinary.com");
  } catch {
    return false;
  }
}

const cloudinaryUrlSchema = z
  .string()
  .url()
  .refine(isCloudinaryUrl, { message: "L'image doit provenir de Cloudinary" })
  .optional()
  .nullable()
  .or(z.literal(""));

// ── Article de campagne ───────────────────────────────────────────────────────

const campaignArticleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  reference: z.string(),
  price: z.number().min(0),
  promoPrice: z.number().min(0).optional().nullable(),
  mainImage: z.string().url().optional().nullable().or(z.literal("")),
  linkUrl: z.string().url().optional().nullable().or(z.literal("")),
});

// ── Image libre (flyer, photo, affiche...) ────────────────────────────────────

const freeImageSchema = z.object({
  id: z.string().min(1),
  cloudinaryId: z.string().min(1),
  url: z.string().url().refine(isCloudinaryUrl, {
    message: "L'image doit provenir de Cloudinary",
  }),
  alt: z.string().min(1, "La description est obligatoire").max(200),
  caption: z.string().max(200).optional().nullable(),
  linkUrl: z.string().url().optional().nullable().or(z.literal("")),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  layout: z.enum(["full", "half"]),
});

// ── Données de campagne email ─────────────────────────────────────────────────

const campaignDataSchema = z.object({
  contentMode: z.enum(["articles", "images", "both"]).default("articles"),
  articles: z.array(campaignArticleSchema).max(4).default([]),
  freeImages: z.array(freeImageSchema).max(4).default([]),
  ctaText: z.string().max(60).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable().or(z.literal("")),
  bannerImageUrl: cloudinaryUrlSchema,
  bannerLinkUrl: z.string().url().optional().nullable().or(z.literal("")),
  campaignVars: z.record(z.string()).default({}),
});

// ── Créer une campagne ────────────────────────────────────────────────────────

export const createCampaignSchema = z
  .object({
    name: z
      .string()
      .min(2, "Minimum 2 caractères")
      .max(100, "Maximum 100 caractères")
      .trim(),
    description: z.string().max(500).optional().or(z.literal("")),
    segmentId: z.string().cuid("Segment invalide"),
    templateId: z.string().cuid("Template invalide").optional().nullable(),
    campaignData: campaignDataSchema.optional().nullable(),
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return new Date(val) > new Date();
        },
        { message: "La date planifiée doit être dans le futur" }
      ),
  })
  .refine(
    (data) => {
      // CTA : texte et URL ensemble ou aucun
      const ctaText = data.campaignData?.ctaText?.trim();
      const ctaUrl = data.campaignData?.ctaUrl?.trim();
      if (ctaText && !ctaUrl) return false;
      if (ctaUrl && !ctaText) return false;
      return true;
    },
    {
      message: "Le texte et le lien du bouton doivent être renseignés ensemble",
      path: ["campaignData", "ctaText"],
    }
  );

// ── Modifier une campagne (DRAFT, SCHEDULED, FAILED) ──────────────────────────

export const updateCampaignSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    segmentId: z.string().cuid().optional(),
    templateId: z.string().cuid().optional().nullable(),
    campaignData: campaignDataSchema.optional().nullable(),
    scheduledAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return new Date(val) > new Date();
        },
        { message: "La date doit être dans le futur" }
      ),
  })
  .refine(
    (data) => {
      const ctaText = data.campaignData?.ctaText?.trim();
      const ctaUrl = data.campaignData?.ctaUrl?.trim();
      if (ctaText && !ctaUrl) return false;
      if (ctaUrl && !ctaText) return false;
      return true;
    },
    {
      message: "Le texte et le lien du bouton doivent être renseignés ensemble",
      path: ["campaignData", "ctaText"],
    }
  );

// ── Planifier une campagne ────────────────────────────────────────────────────

export const scheduleCampaignSchema = z.object({
  campaignId: z.string().cuid(),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: "La date doit être dans le futur" }
    ),
});

// ── Envoyer une campagne immédiatement ────────────────────────────────────────

export const sendCampaignSchema = z.object({
  campaignId: z.string().cuid(),
});

// ── Annuler une campagne ──────────────────────────────────────────────────────

export const cancelCampaignSchema = z.object({
  campaignId: z.string().cuid(),
  reason: z.string().max(200).optional(),
});

// ── Dupliquer une campagne ────────────────────────────────────────────────────
// Le nom de la copie ("Copie de X") est généré côté serveur — voir duplicateCampaign()

export const duplicateCampaignSchema = z.object({
  campaignId: z.string().cuid(),
});

// ── Filtres liste ─────────────────────────────────────────────────────────────

export const campaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  segmentId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ── Types exportés ────────────────────────────────────────────────────────────

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ScheduleCampaignInput = z.infer<typeof scheduleCampaignSchema>;
export type SendCampaignInput = z.infer<typeof sendCampaignSchema>;
export type CancelCampaignInput = z.infer<typeof cancelCampaignSchema>;
export type DuplicateCampaignInput = z.infer<typeof duplicateCampaignSchema>;
export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;
