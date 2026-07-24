import twilio from "twilio";
import { logger } from "@/lib/logger";
import { smsConfig } from "@/lib/sms/config";
import type { MessageResult, SendSmsOptions, SmsProvider } from "./types";

const SMS_SEND_TIMEOUT_MS = 15_000;

function createTwilioClient() {
  return twilio(smsConfig.accountSid, smsConfig.authToken);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Twilio request timed out")), ms);
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

// "+221770000000" → "+221 7X *** ** 00" — jamais le numéro complet dans les logs.
function maskPhone(phone: string): string {
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 4)}${"*".repeat(phone.length - 6)}${phone.slice(-2)}`;
}

function messageForErrorCode(code: number | undefined): string {
  switch (code) {
    case 21211:
      return "Numéro de téléphone invalide";
    case 21610:
      return "Numéro sur liste noire (opted out)";
    case 21614:
      return "Numéro non SMS-compatible";
    default:
      return `Erreur d'envoi SMS. Code: ${code ?? "inconnu"}`;
  }
}

interface TwilioRestError {
  code?: number;
}

function isTwilioRestError(error: unknown): error is TwilioRestError {
  return typeof error === "object" && error !== null && "code" in error;
}

class TwilioProvider implements SmsProvider {
  // Instanciation paresseuse, comme AfricasTalkingProvider — évite qu'un import
  // du module au démarrage du worker plante avant que TWILIO_* soit configuré.
  private client: ReturnType<typeof createTwilioClient> | null = null;

  private getClient() {
    this.client ??= createTwilioClient();
    return this.client;
  }

  async send(options: SendSmsOptions): Promise<MessageResult[]> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    return Promise.all(
      recipients.map((to) => this.sendOne(to, options.message, options.from))
    );
  }

  async sendOne(to: string, message: string, from?: string): Promise<MessageResult> {
    try {
      const result = await withTimeout(
        this.getClient().messages.create({
          to,
          from: from ?? smsConfig.phoneNumber,
          body: message,
        }),
        SMS_SEND_TIMEOUT_MS
      );

      logger.info(
        { sid: result.sid, to: maskPhone(to) },
        "SMS sent successfully via Twilio"
      );

      return { success: true, messageId: result.sid };
    } catch (error) {
      const code = isTwilioRestError(error) ? error.code : undefined;
      const errorMessage = messageForErrorCode(code);

      logger.error({ error: errorMessage, code, to: maskPhone(to) }, "Twilio SMS failed");

      return { success: false, error: errorMessage };
    }
  }
}

export const twilioProvider = new TwilioProvider();
