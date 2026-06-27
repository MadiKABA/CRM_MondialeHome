import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const connection = redis as NonNullable<typeof redis>;

// ============================================================
// QUEUES — une par domaine fonctionnel
// ============================================================
export const QUEUE_NAMES = {
  CAMPAIGNS: "campaigns",
  MESSAGES: "messages",
  AUTOMATIONS: "automations",
  IMPORTS: "imports",
  EXPORTS: "exports",
  WEBHOOKS: "webhooks",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const queues = redis
  ? ({
      campaigns: new Queue(QUEUE_NAMES.CAMPAIGNS, { connection }),
      messages: new Queue(QUEUE_NAMES.MESSAGES, { connection }),
      automations: new Queue(QUEUE_NAMES.AUTOMATIONS, { connection }),
      imports: new Queue(QUEUE_NAMES.IMPORTS, { connection }),
      exports: new Queue(QUEUE_NAMES.EXPORTS, { connection }),
      webhooks: new Queue(QUEUE_NAMES.WEBHOOKS, { connection }),
    } as const)
  : null;

// ============================================================
// JOB TYPE DEFINITIONS
// ============================================================
export interface CampaignJobData {
  campaignId: string;
  type: "sms" | "email" | "whatsapp";
  recipientIds: string[];
}

export interface MessageJobData {
  recipientId: string;
  channel: "sms" | "email" | "whatsapp";
  templateId: string;
  variables: Record<string, string>;
}

export interface AutomationJobData {
  automationId: string;
  triggerId: string;
  contactId: string;
  stepIndex: number;
}

export interface ImportJobData {
  userId: string;
  fileUrl: string;
  type: "clients" | "articles";
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
  };
}

export interface ExportJobData {
  userId: string;
  type: "clients" | "sales" | "campaigns";
  filters: Record<string, unknown>;
  format: "csv" | "xlsx";
}

export interface WebhookJobData {
  provider: "africas-talking" | "brevo" | "meta";
  event: string;
  payload: Record<string, unknown>;
}
