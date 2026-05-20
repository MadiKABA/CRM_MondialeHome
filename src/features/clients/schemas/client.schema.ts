import { z } from "zod";

const phoneRegex = /^\+221[0-9]{9}$/;
const phoneField = z
  .string()
  .regex(phoneRegex, "Format : +221XXXXXXXXX")
  .optional()
  .or(z.literal(""));

// ── Création / Modification ──────────────────────────────────────────────────
export const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50, "50 caractères max"),
  lastName: z.string().max(50).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthDate: z.coerce.date().optional().nullable(),

  phone: phoneField,
  phoneSecondary: phoneField,
  whatsapp: phoneField,
  email: z.string().email("Email invalide").optional().or(z.literal("")),

  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  region: z.string().max(100).optional().or(z.literal("")),

  language: z.enum(["fr", "wo", "en"]).default("fr"),
  preferredChannel: z.enum(["sms", "whatsapp", "email"]).optional(),

  source: z.string().max(100).optional().or(z.literal("")),
  sourceDetails: z.string().max(200).optional().or(z.literal("")),

  smsConsent: z.boolean().default(true),
  whatsappConsent: z.boolean().default(true),
  emailConsent: z.boolean().default(true),

  notes: z.string().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

// ── Filtres ──────────────────────────────────────────────────────────────────
export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  source: z.string().optional(),
  tag: z.string().optional(),
  assigned: z.enum(["me", "all"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "UNSUBSCRIBED", "BLACKLISTED"]).optional(),
  isVip: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z
    .enum(["createdAt", "lastName", "totalSpent", "lastPurchaseAt"])
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type ClientFilters = z.infer<typeof clientFiltersSchema>;

// ── Import ───────────────────────────────────────────────────────────────────
export const importRowSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional(),
  district: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

// ── Suppression ──────────────────────────────────────────────────────────────
export const deleteClientSchema = z.object({
  clientId: z.string().cuid(),
});

// ── Statut rapide ─────────────────────────────────────────────────────────────
export const updateClientStatusSchema = z.object({
  clientId: z.string().cuid(),
  status: z.enum(["ACTIVE", "INACTIVE", "UNSUBSCRIBED", "BLACKLISTED"]),
  reason: z.string().max(200).optional().or(z.literal("")),
});

export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;

// ── Consentement ──────────────────────────────────────────────────────────────
export const updateClientConsentSchema = z.object({
  clientId: z.string().cuid(),
  channel: z.enum(["sms", "whatsapp", "email"]),
  consent: z.boolean(),
  reason: z.string().max(200).optional().or(z.literal("")),
});

export type UpdateClientConsentInput = z.infer<typeof updateClientConsentSchema>;

// ── Assignation ───────────────────────────────────────────────────────────────
export const assignClientSchema = z.object({
  clientId: z.string().cuid(),
  assignedToId: z.string().cuid().nullable(),
});

export type AssignClientInput = z.infer<typeof assignClientSchema>;

// ── Bulk actions ──────────────────────────────────────────────────────────────
const clientIdsList = z
  .array(z.string().cuid())
  .min(1, "Sélectionnez au moins un client")
  .max(500, "Maximum 500 clients par action");

export const bulkUpdateStatusSchema = z.object({
  clientIds: clientIdsList,
  status: z.enum(["ACTIVE", "INACTIVE", "UNSUBSCRIBED", "BLACKLISTED"]),
  reason: z.string().min(1, "Motif requis").max(200),
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

export const bulkAddTagSchema = z.object({
  clientIds: clientIdsList,
  tag: z.string().min(1, "Tag requis").max(50).toLowerCase(),
});

export type BulkAddTagInput = z.infer<typeof bulkAddTagSchema>;

export const bulkRemoveTagSchema = z.object({
  clientIds: clientIdsList,
  tag: z.string().min(1),
});

export type BulkRemoveTagInput = z.infer<typeof bulkRemoveTagSchema>;

export const bulkAssignSchema = z.object({
  clientIds: clientIdsList,
  assignedToId: z.string().cuid().nullable(),
});

export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;

export const bulkDeleteSchema = z.object({
  clientIds: clientIdsList,
  confirmation: z.string().refine((val): boolean => val === "SUPPRIMER", {
    message: "Tapez SUPPRIMER pour confirmer",
  }),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
