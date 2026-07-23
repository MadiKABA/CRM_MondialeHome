import type { SmsMessageAnalysis } from "@/lib/sms/character-counter";
import type { SegmentDTO } from "@/features/segments/types";
import type { CampaignStatus } from "@/features/campaigns/types";

export type { SmsMessageAnalysis };

// Stocké dans Campaign.smsCampaignData (Json?) — voir prisma/schema.prisma
export interface SmsCampaignData {
  produit: string | null;
  reduction: string | null;
}

export interface SmsCampaignPreview {
  messagePreview: string;
  analysis: SmsMessageAnalysis;
}

// Segment enrichi du nombre de clients réellement éligibles au SMS
// (smsConsent = true ET téléphone renseigné) — memberCount reste le total brut.
export interface SmsSegmentDTO extends SegmentDTO {
  smsEligibleCount: number;
}

// ── État du wizard de campagne SMS (4 étapes) ─────────────────────────────────

export interface SmsCampaignFormState {
  name: string;
  description: string;
  segmentId: string;
  templateId: string | null;
  content: string;
  produit: string;
  reduction: string;
  scheduledAt: string | null;
}

// ── Job BullMQ (queue "sms-send") ─────────────────────────────────────────────

export interface SmsJobPayload {
  campaignId: string;
  variantId: string;
  clientIds: string[];
  campaignVars: SmsCampaignData;
  triggeredBy: string;
}

// ── Stats d'une campagne SMS (calculées depuis Message) ───────────────────────

export interface SmsCampaignStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  costActual: number;
}

// ── DTO Campagne SMS (liste + détail) ─────────────────────────────────────────

export interface SmsCampaignDTO {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  segmentName: string;
  segmentCount: number;
  message: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  costEstimated: number;
  costActual: number;
}

export interface PaginatedSmsCampaigns {
  campaigns: SmsCampaignDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    byStatus: Partial<Record<CampaignStatus, number>>;
  };
}

// ── Destinataire individuel d'une campagne SMS (depuis Message) ───────────────

export interface SmsRecipientDTO {
  id: string;
  clientName: string | null;
  phone: string;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  errorMessage: string | null;
}
