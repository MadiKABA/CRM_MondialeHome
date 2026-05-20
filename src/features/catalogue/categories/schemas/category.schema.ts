import { z } from "zod";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Trop long (max 100 caractères)"),
  description: z
    .string()
    .max(500, "Trop long (max 500 caractères)")
    .optional()
    .or(z.literal("")),
  parentId: z.string().cuid().optional().nullable(),
  icon: z.string().max(50).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema;

export const reorderCategoriesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().min(0),
      parentId: z.string().cuid().optional().nullable(),
    })
  ),
});

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type CreateCategoryOutput = z.output<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
export type UpdateCategoryOutput = z.output<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
