import { z } from "zod";

const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const phoneRegex = /^\+221[0-9]{9}$/;

// ── Schéma création utilisateur ───────────────────────────────

export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prénom est requis")
    .max(50, "Trop long")
    .regex(nameRegex, "Caractères non autorisés"),
  lastName: z
    .string()
    .min(1, "Le nom est requis")
    .max(50, "Trop long")
    .regex(nameRegex, "Caractères non autorisés"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .toLowerCase(),
  phone: z
    .string()
    .regex(phoneRegex, "Format requis : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  department: z.string().max(100).optional().or(z.literal("")),
  language: z.enum(["fr", "wo"]).default("fr"),
  timezone: z.string().default("Africa/Dakar"),
  roleIds: z.array(z.string().cuid()).min(1, "Au moins un profil est requis"),
  sendInvitation: z.boolean().default(true),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserOutput = z.output<typeof createUserSchema>;

// ── Schéma modification utilisateur ──────────────────────────

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prénom est requis")
    .max(50)
    .regex(nameRegex, "Caractères non autorisés")
    .optional(),
  lastName: z
    .string()
    .min(1, "Le nom est requis")
    .max(50)
    .regex(nameRegex, "Caractères non autorisés")
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Format requis : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  department: z.string().max(100).optional().or(z.literal("")),
  language: z.enum(["fr", "wo"]).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().cuid()).min(1, "Au moins un profil est requis").optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ── Schéma changement de statut ───────────────────────────────

export const toggleUserStatusSchema = z.object({
  userId: z.string().cuid(),
  isActive: z.boolean(),
  reason: z.string().min(1, "Le motif est requis").max(200, "Motif trop long"),
});

export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;

// ── Schéma suppression (soft delete) avec confirmation typée ──

export const deleteUserSchema = z.object({
  userId: z.string().cuid(),
  confirmation: z.string().refine((val) => val === "SUPPRIMER", {
    message: 'Tapez exactement "SUPPRIMER" pour confirmer',
  }),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

// ── Schéma invitation par email ───────────────────────────────

export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .toLowerCase(),
  firstName: z.string().min(1, "Le prénom est requis").max(50),
  lastName: z.string().min(1, "Le nom est requis").max(50),
  roleIds: z.array(z.string().cuid()).min(1, "Au moins un profil est requis"),
  message: z.string().max(500).optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

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
