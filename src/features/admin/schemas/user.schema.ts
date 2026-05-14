import { z } from "zod";

// ── Schéma création utilisateur ───────────────────────────────

export const createUserSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(100),
  lastName: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Format requis : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  jobTitle: z.string().max(150).optional().or(z.literal("")),
  department: z.string().max(150).optional().or(z.literal("")),
  language: z.enum(["fr", "wo"]).default("fr"),
  timezone: z.string().default("Africa/Dakar"),
  roleIds: z.array(z.string().cuid()).min(1, "Au moins un profil est requis"),
  sendInvitation: z.boolean().default(true),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserOutput = z.output<typeof createUserSchema>;

// ── Schéma modification utilisateur ──────────────────────────

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(100).optional(),
  lastName: z.string().min(1, "Le nom est requis").max(100).optional(),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Format requis : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  jobTitle: z.string().max(150).optional().or(z.literal("")),
  department: z.string().max(150).optional().or(z.literal("")),
  language: z.enum(["fr", "wo"]).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ── Schéma assignation de rôle ────────────────────────────────

export const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

// ── Schéma retrait de rôle ────────────────────────────────────

export const removeRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
});

export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
