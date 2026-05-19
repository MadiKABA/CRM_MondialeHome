import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères"),
  description: z.string().max(200, "Maximum 200 caractères").optional().or(z.literal("")),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères"),
  description: z.string().max(200, "Maximum 200 caractères").optional().or(z.literal("")),
});

export const deleteRoleSchema = z.object({
  roleId: z.string().cuid(),
  replacementRoleId: z.string().cuid().optional(),
  confirmation: z.string().refine((val) => val === "SUPPRIMER", {
    message: 'Tapez exactement "SUPPRIMER" pour confirmer',
  }),
});

export const duplicateRoleSchema = z.object({
  roleId: z.string().cuid(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
export type DuplicateRoleInput = z.infer<typeof duplicateRoleSchema>;
