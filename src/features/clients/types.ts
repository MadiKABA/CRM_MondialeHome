import type { ClientFilters } from "./schemas/client.schema";

// ── DTO liste ────────────────────────────────────────────────────────────────
export interface ClientListItemDTO {
  id: string;
  reference: string | null;
  firstName: string;
  lastName: string | null;
  fullName: string;
  gender: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  source: string | null;
  status: string;
  isVip: boolean;
  smsConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt: Date | null;
  createdAt: Date;
  tags: string[];
}

// ── DTO détail ───────────────────────────────────────────────────────────────
export interface ClientDetailDTO extends ClientListItemDTO {
  phoneSecondary: string | null;
  address: string | null;
  region: string | null;
  birthDate: Date | null;
  language: string;
  preferredChannel: string | null;
  sourceDetails: string | null;
  notes: string | null;
  averageBasket: number;
  firstPurchaseAt: Date | null;
  rfmScore: string | null;
  acquisitionDate: Date;
  updatedAt: Date;
}

// ── Résultat paginé ──────────────────────────────────────────────────────────
export interface PaginatedClients {
  clients: ClientListItemDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    vip: number;
    newThisMonth: number;
  };
}

// ── Import ───────────────────────────────────────────────────────────────────
export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  mapped: Partial<ClientListItemDTO>;
  errors: string[];
  isDuplicate: boolean;
  isValid: boolean;
}

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ row: number; error: string }>;
}

// ── Export ───────────────────────────────────────────────────────────────────
export type ExportFormat = "csv" | "excel" | "pdf";

export interface ExportOptions {
  format: ExportFormat;
  filters?: Partial<ClientFilters>;
  fields?: (keyof ClientListItemDTO)[];
  includeStats?: boolean;
}
