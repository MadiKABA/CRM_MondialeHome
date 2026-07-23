import AfricasTalking from "africastalking";
import { logger } from "@/lib/logger";
import { smsConfig } from "@/lib/sms/config";
import type { MessageResult, SendSmsOptions, SmsProvider } from "./types";

const SMS_SEND_TIMEOUT_MS = 10_000;

function createAfricasTalkingClient() {
  return AfricasTalking({
    apiKey: smsConfig.apiKey,
    username: smsConfig.username,
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Africa's Talking request timed out")),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

class AfricasTalkingProvider implements SmsProvider {
  // Le SDK Africa's Talking valide "apiKey" de façon synchrone dès sa
  // construction et lève une exception si elle est vide — instancier ce
  // client au chargement du module planterait tout le process worker
  // (RFM, segments, email...) tant que AT_API_KEY n'est pas configurée.
  // On construit donc paresseusement, uniquement une fois les credentials
  // vérifiées non vides.
  private client: ReturnType<typeof createAfricasTalkingClient> | null = null;

  private getClient() {
    this.client ??= createAfricasTalkingClient();
    return this.client;
  }

  async send(options: SendSmsOptions): Promise<MessageResult[]> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    if (!smsConfig.apiKey) {
      logger.error("Africa's Talking non configuré (AT_USERNAME / AT_API_KEY manquant)");
      return recipients.map(() => ({
        success: false,
        error: "Africa's Talking non configuré",
      }));
    }

    try {
      const response = await withTimeout(
        this.getClient().SMS.send({
          to: recipients,
          message: options.message,
          from: options.from ?? smsConfig.senderId ?? undefined,
        }),
        SMS_SEND_TIMEOUT_MS
      );

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

  async sendOne(to: string, message: string, from?: string): Promise<MessageResult> {
    const [result] = await this.send({ to, message, ...(from ? { from } : {}) });
    return result ?? { success: false, error: "Aucune réponse d'Africa's Talking" };
  }
}

export const africasTalkingProvider = new AfricasTalkingProvider();
