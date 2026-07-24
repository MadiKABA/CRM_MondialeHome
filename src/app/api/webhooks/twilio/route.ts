// Webhook de statut SMS Twilio (Status Callback).
// Contrairement à Africa's Talking, Twilio signe chaque callback (HMAC-SHA1) —
// on vérifie systématiquement X-Twilio-Signature avant tout traitement.
import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import twilio from "twilio";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { smsConfig } from "@/lib/sms/config";

interface TwilioStatusCallback {
  messageSid: string | null;
  messageStatus: string | null;
  to: string | null;
  errorCode: string | null;
}

async function parseStatusCallback(
  request: NextRequest
): Promise<{ params: Record<string, string>; report: TwilioStatusCallback }> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  const asString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value : null;

  return {
    params,
    report: {
      messageSid: asString(params["MessageSid"]),
      messageStatus: asString(params["MessageStatus"]),
      to: asString(params["To"]),
      errorCode: asString(params["ErrorCode"]),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for") ?? "unknown";

    const rl = await checkRateLimit({
      key: `webhook:twilio:${ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { params, report } = await parseStatusCallback(request);

    const signature = h.get("x-twilio-signature");
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"];
    if (!signature || !appUrl) {
      logger.warn("Twilio webhook — signature ou NEXT_PUBLIC_APP_URL manquant");
      return NextResponse.json({ error: "Requête non signée" }, { status: 403 });
    }

    const webhookUrl = `${appUrl}/api/webhooks/twilio`;
    const isValid = twilio.validateRequest(
      smsConfig.authToken,
      signature,
      webhookUrl,
      params
    );
    if (!isValid) {
      logger.warn("Twilio webhook — signature invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
    }

    if (!report.messageSid || !report.messageStatus) {
      logger.warn({ report }, "Twilio webhook — champs manquants");
      return NextResponse.json({ received: true });
    }

    // Le "MessageSid" doit correspondre à un SMS réellement envoyé par ce CRM.
    const message = await db.message.findFirst({
      where: { externalId: report.messageSid, channel: "SMS" },
      select: { id: true, campaignId: true, status: true },
    });

    if (!message) {
      logger.warn({ sid: report.messageSid }, "Twilio webhook — message inconnu");
      return NextResponse.json({ received: true });
    }

    // Idempotence : ignore les callbacks dupliqués (Twilio peut renvoyer un statut plusieurs fois)
    if (message.status === "DELIVERED" || message.status === "FAILED") {
      return NextResponse.json({ received: true });
    }

    const now = new Date();
    const delivered = report.messageStatus === "delivered";
    const failed =
      report.messageStatus === "failed" || report.messageStatus === "undelivered";

    if (delivered) {
      await db.message.update({
        where: { id: message.id },
        data: { status: "DELIVERED", deliveredAt: now },
      });
    } else if (failed) {
      await db.message.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          failedAt: now,
          errorCode: report.errorCode,
          errorMessage: report.errorCode
            ? `Twilio error ${report.errorCode}`
            : "Échec de livraison",
        },
      });
    }

    await db.messageEvent
      .create({
        data: {
          messageId: message.id,
          eventType: "delivery_report",
          eventData: {
            status: report.messageStatus,
            to: report.to,
            errorCode: report.errorCode,
          },
        },
      })
      .catch(() => {});

    if (message.campaignId && (delivered || failed)) {
      await db.campaign
        .update({
          where: { id: message.campaignId },
          data: delivered
            ? { totalDelivered: { increment: 1 } }
            : { totalFailed: { increment: 1 } },
        })
        .then(async (campaign) => {
          const sent = campaign.totalSent ?? 0;
          const rate = sent > 0 ? (campaign.totalDelivered / sent) * 100 : 0;
          await db.campaign.update({
            where: { id: campaign.id },
            data: { deliveryRate: rate },
          });
        })
        .catch(() => {});
    }

    logger.info(
      {
        messageId: message.id,
        campaignId: message.campaignId,
        status: report.messageStatus,
      },
      "Twilio delivery report processed"
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Twilio webhook processing failed");
    // Toujours 200 pour éviter que Twilio ne retente indéfiniment sur une erreur
    // interne — l'échec est déjà journalisé ci-dessus.
    return NextResponse.json({ received: true });
  }
}
