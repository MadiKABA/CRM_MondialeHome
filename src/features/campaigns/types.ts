import type { EmailCampaignData } from "@/features/email-mass/types";

// ── Statuts de campagne (aligne avec l'enum Prisma CampaignStatus) ────────────

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "SENT",
  "PAUSED",
  "CANCELLED",
  "FAILED",
  "COMPLETED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// ── Labels et couleurs ────────────────────────────────────────────────────────

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiée",
  SENDING: "Envoi en cours",
  SENT: "Envoyée",
  PAUSED: "En pause",
  CANCELLED: "Annulée",
  FAILED: "Échec",
  COMPLETED: "Terminée",
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  SENDING: "bg-amber-50 text-amber-700",
  SENT: "bg-green-50 text-green-700",
  PAUSED: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-red-50 text-red-600",
  FAILED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-800",
};

// ── DTO Campaign ──────────────────────────────────────────────────────────────

export interface CampaignDTO {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  // Cible
  segmentId: string | null;
  segmentName: string;
  segmentCount: number;
  // Template email
  templateId: string | null;
  templateName: string | null;
  // Données campagne
  campaignData: EmailCampaignData | null;
  // Planification
  scheduledAt: Date | null;
  sentAt: Date | null;
  completedAt: Date | null;
  // Stats (mappées depuis totalSent, totalDelivered... du modèle Prisma)
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  unsubscribedCount: number;
  // Taux
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  // Batch M8
  emailBatchId: string | null;
  // Audit
  createdById: string;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Stats globales ────────────────────────────────────────────────────────────

export interface CampaignGlobalStats {
  total: number;
  byStatus: Partial<Record<CampaignStatus, number>>;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgDeliveryRate: number;
  lastCampaignAt: Date | null;
}

// ── Résultat paginé ───────────────────────────────────────────────────────────

export interface PaginatedCampaigns {
  campaigns: CampaignDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: CampaignGlobalStats;
}

// ── Transitions de statut autorisées ─────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["SCHEDULED", "SENDING", "CANCELLED"],
  SCHEDULED: ["SENDING", "PAUSED", "CANCELLED"],
  SENDING: ["PAUSED", "CANCELLED"],
  PAUSED: ["SENDING", "CANCELLED"],
  SENT: [],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ["DRAFT"],
};

export function isTransitionAllowed(from: CampaignStatus, to: CampaignStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Statuts terminaux — aucune modification possible
export const TERMINAL_STATUSES: CampaignStatus[] = ["SENT", "COMPLETED", "CANCELLED"];

// Statuts supprimables (soft delete)
export const DELETABLE_STATUSES: CampaignStatus[] = ["DRAFT", "CANCELLED", "FAILED"];

// Statuts modifiables via le wizard (page /campagnes/[id]/modifier)
export const EDITABLE_STATUSES: CampaignStatus[] = ["DRAFT", "SCHEDULED", "FAILED"];
