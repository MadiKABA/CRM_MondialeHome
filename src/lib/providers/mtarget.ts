import { logger } from "@/lib/logger";
import { maskPhoneNumber } from "@/lib/sms/validator";
import { mtargetConfig } from "@/lib/sms/config";
import type { MessageResult, SendSmsOptions, SmsProvider } from "./types";

// Pas de "server-only" ici : ce module est importé par src/server/workers/sms.worker.ts,
// exécuté via tsx (pas de bundler Next.js) — server-only y jetterait une exception au chargement.

export interface MtargetSendResult extends MessageResult {
  code?: string;
}

export interface MtargetBalanceResult {
  success: boolean;
  amount?: number;
  currency?: string;
  error?: string;
}

const MTARGET_ERROR_MESSAGES: Record<string, string> = {
  "-1": "Identifiants Mtarget incorrects",
  "-2": "Numéro de téléphone invalide",
  "-3": "Opérateur invalide",
  "-4": "Destination Sénégal non activée. Contacter support@mtarget.fr",
  "-9": "ServiceId incorrect",
  "-10": "Message trop long",
  "-11": "Crédit insuffisant sur le compte Mtarget",
  "-12": "Paramètre invalide",
};

function messageForErrorCode(code: string): string {
  return MTARGET_ERROR_MESSAGES[code] ?? `Erreur Mtarget. Code: ${code}`;
}

interface MtargetMessageResult {
  msisdn?: string;
  smscount?: string;
  code?: string;
  reason?: string;
  ticket?: string;
}

interface MtargetMessagesResponse {
  results?: MtargetMessageResult[];
}

async function postForm(
  url: string,
  params: Record<string, string>
): Promise<{ ok: boolean; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), mtargetConfig.timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
      signal: controller.signal,
    });
    const body = await response.text();
    return { ok: response.ok, body };
  } finally {
    clearTimeout(timer);
  }
}

// remoteid = notre MessageLog.id → Mtarget nous le renvoie dans le webhook DLR,
// ce qui permet de retrouver le message envoyé sans dépendre du ticket Mtarget.
function buildUniqueId(messageLogId: string, to: string): string {
  const raw = `${messageLogId.slice(0, 17)}-${to.replace("+", "")}`;
  return raw.slice(0, 35);
}

class MtargetProvider implements SmsProvider {
  async send(options: SendSmsOptions): Promise<MessageResult[]> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    return Promise.all(recipients.map((to) => this.sendSms(to, options.message, to)));
  }

  async sendSms(
    to: string,
    message: string,
    messageLogId: string
  ): Promise<MtargetSendResult> {
    const masked = maskPhoneNumber(to);

    const params: Record<string, string> = {
      username: mtargetConfig.username,
      password: mtargetConfig.password,
      msisdn: to,
      msg: message,
      sender: mtargetConfig.senderId,
      remoteid: messageLogId.slice(0, 250),
      uniqueid: buildUniqueId(messageLogId, to),
    };
    if (mtargetConfig.serviceId) {
      params["serviceid"] = mtargetConfig.serviceId;
    }

    let body: string;
    try {
      const response = await postForm(mtargetConfig.apiUrl, params);
      body = response.body;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.error({ to: masked }, "Mtarget SMS timeout");
        return { success: false, error: "Délai dépassé (45s). Mtarget ne répond pas." };
      }
      logger.error({ to: masked }, "Mtarget SMS network error");
      return { success: false, error: "Erreur réseau Mtarget. Réessayer." };
    }

    let parsed: MtargetMessagesResponse;
    try {
      parsed = JSON.parse(body) as MtargetMessagesResponse;
    } catch {
      logger.error({ to: masked }, "Mtarget SMS — réponse invalide");
      return { success: false, error: "Réponse Mtarget invalide." };
    }

    const result = parsed.results?.[0];
    if (!result || !result.code) {
      logger.error({ to: masked }, "Mtarget SMS — réponse invalide");
      return { success: false, error: "Réponse Mtarget invalide." };
    }

    if (result.code === "0") {
      logger.info(
        {
          ticket: result.ticket,
          to: masked,
          smscount: result.smscount,
          remoteid: messageLogId,
        },
        "Mtarget SMS sent"
      );
      return { success: true, messageId: result.ticket };
    }

    logger.error(
      { code: result.code, reason: result.reason, to: masked },
      "Mtarget SMS failed"
    );
    return {
      success: false,
      error: messageForErrorCode(result.code),
      code: result.code,
    };
  }
}

export const mtargetProvider = new MtargetProvider();

export async function sendSms(
  to: string,
  message: string,
  messageLogId: string
): Promise<MtargetSendResult> {
  return mtargetProvider.sendSms(to, message, messageLogId);
}

export async function checkSmsBalance(): Promise<MtargetBalanceResult> {
  try {
    const { body } = await postForm(mtargetConfig.balanceUrl, {
      username: mtargetConfig.username,
      password: mtargetConfig.password,
    });

    const parsed = JSON.parse(body) as {
      balance?: string | number;
      amount?: string | number;
      currency?: string;
    };
    const rawAmount = parsed.amount ?? parsed.balance;
    const amount = typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;

    if (typeof amount !== "number" || Number.isNaN(amount)) {
      logger.error("Mtarget balance — réponse invalide");
      return { success: false, error: "Réponse Mtarget invalide." };
    }

    const currency = parsed.currency ?? "EUR";
    logger.info({ amount, currency }, "Mtarget SMS balance");
    return { success: true, amount, currency };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Délai dépassé (45s). Mtarget ne répond pas." };
    }
    logger.error("Mtarget balance — erreur réseau");
    return { success: false, error: "Erreur réseau Mtarget. Réessayer." };
  }
}
