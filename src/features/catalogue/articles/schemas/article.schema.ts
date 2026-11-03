import { z } from "zod";

const CURRENCIES = ["XOF", "EUR", "USD"] as const;
const STATUSES = [
  "AVAILABLE",
  "OUT_OF_STOCK",
  "COMING_SOON",
  "ARCHIVED",
  "DISCONTINUED",
] as const;

// Un champ vide (chaîne vide, null, NaN) est traité comme absent.
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v;

const optionalNumber = (message = "Nombre invalide") =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: message })
      .min(0, "Valeur négative interdite")
      .optional()
  );

const optionalDate = z.preprocess(
  emptyToUndefined,
  z.coerce.date({ invalid_type_error: "Date invalide" }).optional()
);

const nameField = z
  .string({ required_error: "Le nom est requis" })
  .trim()
  .min(2, "Minimum 2 caractères")
  .max(150, "Maximum 150 caractères");

const categoryField = z
  .string({
    required_error: "La catégorie est requise",
    invalid_type_error: "La catégorie est requise",
  })
  .min(1, "La catégorie est requise")
  .cuid("Catégorie invalide");

interface RuleInput {
  isNew?: boolean;
  arrivalDate?: Date;
  price?: number;
  promoPrice?: number;
  promoStartDate?: Date;
  promoEndDate?: Date;
}

// Règles conditionnelles partagées (création rapide, création complète, modification)
function applyArticleRules(data: RuleInput, ctx: z.RefinementCtx) {
  if (data.isNew && !data.arrivalDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["arrivalDate"],
      message: "La date d'arrivée est requise pour une nouvelle arrivée",
    });
  }

  const { promoStartDate: start, promoEndDate: end } = data;
  if (start && !end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["promoEndDate"],
      message: "La date de fin de promo est requise",
    });
  }
  if (end && !start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["promoStartDate"],
      message: "La date de début de promo est requise",
    });
  }
  if (start && end && end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["promoEndDate"],
      message: "La date de fin doit être postérieure à la date de début",
    });
  }

  if (data.promoPrice !== undefined) {
    if (data.price === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoPrice"],
        message: "Renseignez d'abord le prix pour définir un prix promotionnel",
      });
    } else if (data.promoPrice >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoPrice"],
        message: "Le prix promotionnel doit être inférieur au prix normal",
      });
    }
  }
}

// Schéma unique : création rapide, création complète et modification.
// Obligatoires : nom et catégorie. Tout le reste est optionnel.
const articleShape = {
  name: nameField,
  // Auto-générée côté serveur : jamais saisie, ignorée à la création et à la modification
  reference: z.string().max(50).optional(),
  barcode: z.string().max(50).optional().or(z.literal("")),
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),

  categoryId: categoryField,
  brand: z.string().max(100).optional().or(z.literal("")),
  supplier: z.string().max(100).optional().or(z.literal("")),

  color: z.string().max(100).optional().or(z.literal("")),
  material: z.string().max(100).optional().or(z.literal("")),
  dimensions: z.string().max(100).optional().or(z.literal("")),
  weight: optionalNumber(),
  attributes: z.record(z.string(), z.string()).optional().default({}),

  price: optionalNumber().pipe(z.number().max(999_999_999, "Prix trop élevé").optional()),
  promoPrice: optionalNumber(),
  promoStartDate: optionalDate,
  promoEndDate: optionalDate,
  costPrice: optionalNumber(),
  currency: z.enum(CURRENCIES).default("XOF"),

  stock: z.preprocess(
    (v) => (emptyToUndefined(v) === undefined ? 0 : v),
    z.coerce.number().int("Entier requis").min(0, "Valeur négative interdite")
  ),
  stockAlert: z.preprocess(
    (v) => (emptyToUndefined(v) === undefined ? 5 : v),
    z.coerce.number().int("Entier requis").min(0, "Valeur négative interdite")
  ),

  status: z.enum(STATUSES).default("AVAILABLE"),
  isNew: z.boolean().default(false),
  arrivalDate: optionalDate,

  mainImage: z.string().optional().nullable(),
  images: z.array(z.string()).max(5, "Maximum 5 images secondaires").default([]),
  videoUrl: z.string().url("URL vidéo invalide").optional().or(z.literal("")),

  tags: z.array(z.string().max(50)).max(20).default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
};

export const articleSchema = z.object(articleShape).superRefine(applyArticleRules);

export type ArticleInput = z.input<typeof articleSchema>;
export type ArticleOutput = z.output<typeof articleSchema>;

// ── Création rapide ───────────────────────────────────────────────────────
// Sous-ensemble du schéma unique (mêmes champs, mêmes règles).

export const quickCreateArticleSchema = z
  .object({
    name: articleShape.name,
    categoryId: articleShape.categoryId,
    isNew: articleShape.isNew,
    arrivalDate: articleShape.arrivalDate,
    mainImage: articleShape.mainImage,
  })
  .superRefine(applyArticleRules);

export type QuickCreateArticleInput = z.input<typeof quickCreateArticleSchema>;
export type QuickCreateArticleOutput = z.output<typeof quickCreateArticleSchema>;

export const articleFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  status: z.enum(STATUSES).optional(),
  isNew: z.coerce.boolean().optional(),
  brand: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  inPromo: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z
    .enum(["name", "price", "stock", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type ArticleFilters = z.infer<typeof articleFiltersSchema>;

export const bulkArticleActionSchema = z.object({
  articleIds: z.array(z.string().cuid()).min(1).max(200),
  action: z.enum(["archive", "activate", "delete", "set_new", "unset_new"]),
});

export type BulkArticleActionInput = z.infer<typeof bulkArticleActionSchema>;

export const updateStockSchema = z.object({
  articleId: z.string().cuid(),
  newStock: z.coerce.number().int().min(0),
  reason: z.string().min(1, "Le motif est requis").max(200),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
