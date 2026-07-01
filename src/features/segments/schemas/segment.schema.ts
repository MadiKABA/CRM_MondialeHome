import { z } from "zod";

// ── Critères disponibles ──────────────────────────────────────────────────────

export const criterionSchema = z
  .object({
    field: z.enum([
      "totalSpent",
      "totalOrders",
      "averageBasket",
      "lastPurchaseAt",
      "firstPurchaseAt",
      "city",
      "district",
      "status",
      "isVip",
      "smsConsent",
      "whatsappConsent",
      "emailConsent",
      "source",
      "createdAt",
      "rfmScore",
      "hasOrderedArticle",
      "hasNotOrderedArticle",
      "hasOrderedCategory",
      "hasNotOrderedCategory",
      "hasOrderedArticleInPeriod",
      "hasOrderedCategoryInPeriod",
    ]),
    operator: z.string().min(1),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.array(z.number()),
    ]),
    value2: z.union([z.string(), z.number()]).optional().nullable(),
    // Critères produit / catégorie
    articleId: z.string().cuid().optional().nullable(),
    articleName: z.string().optional().nullable(),
    categoryId: z.string().cuid().optional().nullable(),
    categoryName: z.string().optional().nullable(),
    periodDays: z.number().int().min(1).max(365).optional().nullable(),
  })
  .superRefine((c, ctx) => {
    const articleFields = [
      "hasOrderedArticle",
      "hasNotOrderedArticle",
      "hasOrderedArticleInPeriod",
    ];
    const categoryFields = [
      "hasOrderedCategory",
      "hasNotOrderedCategory",
      "hasOrderedCategoryInPeriod",
    ];
    const periodFields = ["hasOrderedArticleInPeriod", "hasOrderedCategoryInPeriod"];

    if (articleFields.includes(c.field) && !c.articleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un article doit être sélectionné pour ce critère",
        path: ["articleId"],
      });
    }
    if (categoryFields.includes(c.field) && !c.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une catégorie doit être sélectionnée pour ce critère",
        path: ["categoryId"],
      });
    }
    if (periodFields.includes(c.field) && !c.periodDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une période (en jours) doit être précisée pour ce critère",
        path: ["periodDays"],
      });
    }
  });

export type Criterion = z.infer<typeof criterionSchema>;

export const criteriaGroupSchema = z.object({
  operator: z.enum(["AND", "OR"]).default("AND"),
  criteria: z.array(criterionSchema).min(1, "Au moins un critère requis"),
});

// ── Création / mise à jour groupe statique ────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(80, "Maximum 80 caractères").trim(),
  description: z.string().max(300).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide")
    .default("#8B6914"),
  icon: z.string().max(10).optional().or(z.literal("")),
});

// ── Création segment dynamique ────────────────────────────────────────────────

export const createSegmentSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(80, "Maximum 80 caractères").trim(),
  description: z.string().max(300).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#8B6914"),
  icon: z.string().max(10).optional().or(z.literal("")),
  criteria: criteriaGroupSchema,
  autoRefresh: z.boolean().default(true),
});

// ── Gestion membres ───────────────────────────────────────────────────────────

export const addMembersSchema = z.object({
  groupId: z.string().cuid(),
  clientIds: z
    .array(z.string().cuid())
    .min(1, "Sélectionnez au moins un client")
    .max(500, "Maximum 500 clients à la fois"),
});

export const removeMemberSchema = z.object({
  groupId: z.string().cuid(),
  clientId: z.string().cuid(),
});

export const removeMembersSchema = z.object({
  groupId: z.string().cuid(),
  clientIds: z.array(z.string().cuid()).min(1),
});

// ── Suppression ───────────────────────────────────────────────────────────────

export const deleteSegmentSchema = z.object({
  id: z.string().cuid(),
  confirmation: z.string().refine((val) => val === "SUPPRIMER", {
    message: "Tapez SUPPRIMER pour confirmer",
  }),
});

// ── Update schemas (alias des schemas de création) ────────────────────────────

export const updateGroupSchema = createGroupSchema;
export const updateSegmentSchema = createSegmentSchema;

// ── Types exportés ────────────────────────────────────────────────────────────

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type CriteriaGroup = z.infer<typeof criteriaGroupSchema>;
