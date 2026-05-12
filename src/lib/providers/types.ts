// ============================================================
// INTERFACE UNIFIÉE — Message Provider
// ============================================================

export interface SendSmsOptions {
  to: string | string[];
  message: string;
  from?: string;
}

export interface SendEmailOptions {
  to: { email: string; name?: string } | { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: { email: string; name: string };
  templateId?: number;
  params?: Record<string, string | number | boolean>;
}

export interface SendWhatsAppOptions {
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(options: SendSmsOptions): Promise<MessageResult[]>;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<MessageResult>;
}

export interface WhatsAppProvider {
  send(options: SendWhatsAppOptions): Promise<MessageResult>;
}
