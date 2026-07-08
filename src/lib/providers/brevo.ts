import * as Brevo from "@getbrevo/brevo";
import { logger } from "@/lib/logger";
import type {
  EmailProvider,
  MessageResult,
  SendEmailOptions,
  SendWhatsAppOptions,
  WhatsAppProvider,
} from "./types";

function createBrevoClient() {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env["BREVO_API_KEY"] ?? ""
  );
  return apiInstance;
}

class BrevoEmailProvider implements EmailProvider {
  private client = createBrevoClient();

  async send(options: SendEmailOptions): Promise<MessageResult> {
    try {
      const toList = Array.isArray(options.to) ? options.to : [options.to];

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.to = toList;
      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.htmlContent;
      sendSmtpEmail.textContent = options.textContent;
      sendSmtpEmail.sender = options.from ?? {
        email: process.env["BREVO_SENDER_EMAIL"] ?? "",
        name: process.env["BREVO_SENDER_NAME"] ?? "Mondiale Home",
      };

      if (options.templateId) {
        sendSmtpEmail.templateId = options.templateId;
        sendSmtpEmail.params = options.params;
      }

      const response = await this.client.sendTransacEmail(sendSmtpEmail);

      logger.info({ messageId: response.body.messageId }, "Email sent via Brevo");

      return { success: true, messageId: response.body.messageId };
    } catch (error) {
      logger.error({ error }, "Brevo email failed");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// WhatsApp via Brevo (placeholder — utilise Meta API directement)
class BrevoWhatsAppProvider implements WhatsAppProvider {
  async send(options: SendWhatsAppOptions): Promise<MessageResult> {
    // TODO: implémenter via Meta WhatsApp Business API
    logger.info(options, "WhatsApp send requested (not yet implemented)");
    return { success: false, error: "Not implemented" };
  }
}

export const brevoEmailProvider = new BrevoEmailProvider();
export const brevoWhatsAppProvider = new BrevoWhatsAppProvider();
