import { z } from "zod";

// ── Template SMS ───────────────────────────────────────────────────────────────
// Pas de subject/preheader/conclusion (les SMS n'en ont pas) — juste un nom et
// le corps du message, limité à 459 caractères (= 3 SMS GSM-7 max).

export const createSmsTemplateSchema = z.object({
  name: z
    .string()
    .min(2, "Minimum 2 caractères")
    .max(100, "Maximum 100 caractères")
    .trim(),
  content: z
    .string()
    .min(1, "Le message est requis")
    .max(459, "459 caractères maximum (3 SMS)"),
});

export type CreateSmsTemplateInput = z.infer<typeof createSmsTemplateSchema>;

// ── Variables de campagne SMS ─────────────────────────────────────────────────
// produit / reduction sont saisis à la création de la campagne, pas dans le
// template (voir {{produit}} et {{reduction}} dans src/lib/sms/personalizer.ts)

export const smsCampaignVarsSchema = z.object({
  produit: z.string().max(50, "50 caractères max").optional().nullable(),
  reduction: z
    .string()
    .regex(/^\d{1,3}$/, "Chiffre uniquement")
    .refine((val) => Number(val) >= 1 && Number(val) <= 100, {
      message: "Doit être entre 1 et 100",
    })
    .optional()
    .nullable(),
});

// ── Création d'une campagne SMS ───────────────────────────────────────────────

export const createSmsCampaignSchema = z.object({
  name: z.string().min(2, "2 caractères minimum").max(100, "100 caractères max").trim(),
  description: z.string().max(500, "500 caractères max").optional().nullable(),
  segmentId: z.string().cuid("Segment invalide"),
  templateId: z.string().cuid("Template invalide").optional().nullable(),
  content: z
    .string()
    .min(1, "Le message est requis")
    .max(459, "459 caractères maximum (3 SMS)"),
  campaignVars: smsCampaignVarsSchema.default({}),
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
});

export type CreateSmsCampaignInput = z.infer<typeof createSmsCampaignSchema>;

// ── Prévisualisation d'un message SMS ─────────────────────────────────────────

export const previewSmsMessageSchema = z.object({
  templateId: z.string().cuid("Template invalide"),
  campaignVars: smsCampaignVarsSchema.default({}),
});

export type PreviewSmsMessageInput = z.infer<typeof previewSmsMessageSchema>;

// ── Filtres liste des campagnes SMS ───────────────────────────────────────────

export const smsCampaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type SmsCampaignFilters = z.infer<typeof smsCampaignFiltersSchema>;
