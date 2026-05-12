import AfricasTalking from "africastalking";
import { logger } from "@/lib/logger";
import type { MessageResult, SendSmsOptions, SmsProvider } from "./types";

function createAfricasTalkingClient() {
  return AfricasTalking({
    apiKey: process.env["AT_API_KEY"] ?? "",
    username: process.env["AT_USERNAME"] ?? "sandbox",
  });
}

class AfricasTalkingProvider implements SmsProvider {
  private client = createAfricasTalkingClient();

  async send(options: SendSmsOptions): Promise<MessageResult[]> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
      const response = await this.client.SMS.send({
        to: recipients,
        message: options.message,
        from: options.from ?? process.env["AT_SENDER_ID"],
      });

      const results: MessageResult[] = response.SMSMessageData.Recipients.map((r) => ({
        success: r.status === "Success",
        messageId: r.messageId,
        ...(r.status !== "Success" ? { error: r.status } : {}),
      }));

      logger.info(
        { count: results.length, success: results.filter((r) => r.success).length },
        "SMS batch sent via Africa's Talking"
      );

      return results;
    } catch (error) {
      logger.error({ error }, "Africa's Talking SMS failed");
      return recipients.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }
}

export const africasTalkingProvider = new AfricasTalkingProvider();
