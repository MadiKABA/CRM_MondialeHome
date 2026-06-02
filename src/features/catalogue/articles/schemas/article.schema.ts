import { z } from "zod";

const CURRENCIES = ["XOF", "EUR", "USD"] as const;
const STATUSES = [
  "AVAILABLE",
  "OUT_OF_STOCK",
  "COMING_SOON",
  "ARCHIVED",
  "DISCONTINUED",
] as const;

export const articleSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis").max(200, "Trop long"),
    reference: z
      .string()
      .min(1, "La référence est requise")
      .max(50)
      .regex(/^[A-Z0-9\-_]+$/, "Uniquement lettres majuscules, chiffres, - et _"),
    barcode: z.string().max(50).optional().or(z.literal("")),
    shortDescription: z.string().max(300).optional().or(z.literal("")),
    description: z.string().max(5000).optional().or(z.literal("")),

    categoryId: z.string().cuid().optional().nullable(),
    brand: z.string().max(100).optional().or(z.literal("")),
    supplier: z.string().max(100).optional().or(z.literal("")),

    color: z.string().max(100).optional().or(z.literal("")),
    material: z.string().max(100).optional().or(z.literal("")),
    dimensions: z.string().max(100).optional().or(z.literal("")),
    weight: z.coerce.number().min(0).optional().nullable(),
    attributes: z.record(z.string(), z.string()).optional().default({}),

    price: z.coerce
      .number()
      .min(0, "Le prix ne peut pas être négatif")
      .max(999_999_999, "Prix trop élevé"),
    promoPrice: z.coerce.number().min(0).optional().nullable(),
    promoStartDate: z.coerce.date().optional().nullable(),
    promoEndDate: z.coerce.date().optional().nullable(),
    costPrice: z.coerce.number().min(0).optional().nullable(),
    currency: z.enum(CURRENCIES).default("XOF"),

    stock: z.coerce.number().int().min(0).default(0),
    stockAlert: z.coerce.number().int().min(0).default(5),

    status: z.enum(STATUSES).default("AVAILABLE"),
    isNew: z.boolean().default(false),
    arrivalDate: z.coerce.date().optional().nullable(),

    mainImage: z
      .string()
      .optional()
      .nullable()
      .refine((url) => {
        if (!url) return true;
        if (url.startsWith("blob:")) return true; // aperçu local temporaire
        return url.includes("res.cloudinary.com");
      }, "L'image doit être hébergée sur Cloudinary"),
    images: z
      .array(
        z
          .string()
          .url()
          .refine(
            (url) => url.includes("res.cloudinary.com"),
            "Les images doivent être hébergées sur Cloudinary"
          )
      )
      .max(10, "Maximum 10 images")
      .default([]),
    videoUrl: z.string().url("URL vidéo invalide").optional().or(z.literal("")),

    tags: z.array(z.string().max(50)).max(20).default([]),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .refine(
    (data) => {
      if (data.promoPrice !== null && data.promoPrice !== undefined) {
        return data.promoPrice < data.price;
      }
      return true;
    },
    {
      message: "Le prix promotionnel doit être inférieur au prix normal",
      path: ["promoPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.promoStartDate && data.promoEndDate) {
        return data.promoEndDate > data.promoStartDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être après la date de début",
      path: ["promoEndDate"],
    }
  );

export type ArticleInput = z.input<typeof articleSchema>;
export type ArticleOutput = z.output<typeof articleSchema>;

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
