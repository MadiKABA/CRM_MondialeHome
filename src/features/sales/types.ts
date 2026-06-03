// ── Enums ────────────────────────────────────────────────────────────────────

export type SaleStatusType =
  | "PENDING"
  | "PAID"
  | "PARTIAL"
  | "UNPAID"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethodType =
  | "WAVE"
  | "ORANGE_MONEY"
  | "FREE_MONEY"
  | "CASH"
  | "BANK_TRANSFER"
  | "CREDIT"
  | "CARD"
  | "CHECK"
  | "OTHER";

// ── Labels & couleurs ─────────────────────────────────────────────────────────

export const SALE_STATUS_LABELS: Record<SaleStatusType, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  PARTIAL: "Partiel",
  UNPAID: "Impayée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export const SALE_STATUS_COLORS: Record<SaleStatusType, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
  UNPAID: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  FREE_MONEY: "Free Money",
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  CREDIT: "Crédit",
  CARD: "Carte bancaire",
  CHECK: "Chèque",
  OTHER: "Autre",
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, string> = {
  WAVE: "📱",
  ORANGE_MONEY: "🟠",
  FREE_MONEY: "🟣",
  CASH: "💵",
  BANK_TRANSFER: "🏦",
  CREDIT: "📋",
  CARD: "💳",
  CHECK: "📄",
  OTHER: "💰",
};

// ── DTO liste ─────────────────────────────────────────────────────────────────

export interface SaleListItemDTO {
  id: string;
  reference: string;
  clientId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  sellerId: string | null;
  sellerName: string | null;
  status: SaleStatusType;
  primaryPaymentMethod: PaymentMethodType | null;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  remainingAmount: number;
  itemsCount: number;
  soldAt: Date;
  createdAt: Date;
}

// ── DTO détail ────────────────────────────────────────────────────────────────

export interface SaleDetailDTO extends SaleListItemDTO {
  discountPercent: number | null;
  notes: string | null;
  campaignId: string | null;
  campaignName: string | null;
  items: SaleItemDTO[];
  payments: PaymentDTO[];
}

export interface SaleItemDTO {
  id: string;
  articleId: string | null;
  articleName: string;
  articleRef: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;
}

export interface PaymentDTO {
  id: string;
  method: PaymentMethodType;
  methodLabel: string;
  amount: number;
  reference: string | null;
  notes: string | null;
  paidAt: Date;
}

// ── Résultat paginé ───────────────────────────────────────────────────────────

export interface PaginatedSales {
  sales: SaleListItemDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: SaleStats;
}

export interface SaleStats {
  totalRevenue: number;
  totalSales: number;
  averageBasket: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  pendingCount: number;
  topPaymentMethod: PaymentMethodType | null;
}
