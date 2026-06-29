import type { CampaignArticle } from "@/features/templates/types";

// ── Données de campagne passées à chaque envoi ────────────────────────────────

export interface EmailCampaignData {
  articles: CampaignArticle[];
  ctaText: string | null;
  ctaUrl: string | null;
  bannerImageUrl: string | null;
  campaignVars: Record<string, string>;
}

// ── Input pour lancer un envoi en masse ──────────────────────────────────────

export interface SendEmailBatchInput {
  templateId: string;
  segmentId: string;
  campaignData: EmailCampaignData;
}

// ── Input pour un envoi unitaire ─────────────────────────────────────────────

export interface SendEmailToClientInput {
  templateId: string;
  clientId: string;
  campaignData: EmailCampaignData;
}

// ── DTO Batch ─────────────────────────────────────────────────────────────────

export interface EmailBatchDTO {
  id: string;
  templateId: string;
  templateName: string;
  segmentId: string | null;
  segmentName: string | null;
  status: EmailBatchStatusType;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  bouncedCount: number;
  failedCount: number;
  clickedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null;
  createdAt: Date;
  createdByName: string | null;
}

// ── DTO MessageLog ────────────────────────────────────────────────────────────

export interface MessageLogDTO {
  id: string;
  email: string;
  clientId: string | null;
  clientName: string | null;
  status: MessageStatusType;
  resendId: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  bouncedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

// ── Résultat d'un envoi ───────────────────────────────────────────────────────

export interface SendEmailResult {
  batchId: string;
  queued: number;
  skipped: number;
  estimatedTime: number;
}

// ── Payload du job BullMQ ─────────────────────────────────────────────────────

export interface EmailJobPayload {
  batchId: string;
  templateId: string;
  clientIds: string[];
  campaignData: EmailCampaignData;
  triggeredBy: string;
}

// ── Résultat webhook Resend ───────────────────────────────────────────────────

export interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    created_at: string;
  };
}

// Types énums (string unions correspondant aux enums Prisma)

export type EmailBatchStatusType =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type MessageStatusType =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "FAILED"
  | "SKIPPED";

export const BATCH_STATUS_LABELS: Record<EmailBatchStatusType, string> = {
  PENDING: "En attente",
  PROCESSING: "Envoi en cours",
  COMPLETED: "Terminé",
  FAILED: "Échec",
  CANCELLED: "Annulé",
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatusType, string> = {
  PENDING: "En attente",
  SENT: "Envoyé",
  DELIVERED: "Livré",
  OPENED: "Ouvert",
  CLICKED: "Cliqué",
  BOUNCED: "Rejeté",
  FAILED: "Échoué",
  SKIPPED: "Ignoré",
};
