import { z } from "zod";

const PAYMENT_METHODS = [
  "WAVE",
  "ORANGE_MONEY",
  "FREE_MONEY",
  "CASH",
  "BANK_TRANSFER",
  "CREDIT",
  "CARD",
  "CHECK",
  "OTHER",
] as const;

const SALE_STATUSES = [
  "PENDING",
  "PAID",
  "PARTIAL",
  "UNPAID",
  "CANCELLED",
  "REFUNDED",
] as const;

// ── Ligne d'article ───────────────────────────────────────────────────────────
export const saleItemSchema = z.object({
  articleId: z.string().cuid().optional().nullable(),
  articleName: z.string().min(1, "Nom article requis").max(200),
  articleRef: z.string().min(1, "Référence requise").max(50),
  unitPrice: z.coerce.number().min(0, "Prix ne peut pas être négatif"),
  quantity: z.coerce.number().int().min(1, "Quantité minimum : 1").max(9999),
  discount: z.coerce.number().min(0).default(0),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;

// ── Paiement ─────────────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().min(1, "Montant requis"),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ── Création d'une vente ──────────────────────────────────────────────────────
export const createSaleSchema = z.object({
  clientId: z.string().cuid().optional().nullable(),
  campaignId: z.string().cuid().optional().nullable(),
  soldAt: z.coerce.date().default(() => new Date()),
  items: z.array(saleItemSchema).min(1, "Ajoutez au moins un article"),
  discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  discountAmount: z.coerce.number().min(0).optional().nullable(),
  payments: z.array(paymentSchema).optional().default([]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
// Type pour React Hook Form (les champs avec .default() sont optionnels côté input)
export type SaleFormValues = z.input<typeof createSaleSchema>;

// ── Ajout d'un paiement ───────────────────────────────────────────────────────
export const addPaymentSchema = z.object({
  saleId: z.string().cuid(),
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().min(1, "Montant requis"),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export type AddPaymentInput = z.infer<typeof addPaymentSchema>;

// ── Annulation ────────────────────────────────────────────────────────────────
export const cancelSaleSchema = z.object({
  saleId: z.string().cuid(),
  reason: z.string().min(1, "Motif requis").max(300),
});

export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

// ── Filtres liste ─────────────────────────────────────────────────────────────
export const saleFiltersSchema = z.object({
  search: z.string().optional(),
  clientId: z.string().cuid().optional(),
  sellerId: z.string().cuid().optional(),
  status: z.enum(SALE_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(["soldAt", "totalAmount", "createdAt"]).default("soldAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type SaleFilters = z.infer<typeof saleFiltersSchema>;

export { PAYMENT_METHODS, SALE_STATUSES };
