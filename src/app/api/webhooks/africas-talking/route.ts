// Webhook de livraison SMS Africa's Talking (Delivery Reports).
// Contrairement à Resend/svix, Africa's Talking ne signe pas ses callbacks —
// la seule vérification possible est que le "id" reçu corresponde à un
// message qu'on a réellement envoyé (voir db.message.findFirst ci-dessous).
import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

interface AtDeliveryReport {
  id: string | null;
  status: string | null;
  phoneNumber: string | null;
  networkCode: string | null;
  failureReason: string | null;
}

async function parseDeliveryReport(request: NextRequest): Promise<AtDeliveryReport> {
  const contentType = request.headers.get("content-type") ?? "";

  const raw: Record<string, unknown> = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const asString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value : null;

  return {
    id: asString(raw["id"]),
    status: asString(raw["status"]),
    phoneNumber: asString(raw["phoneNumber"]),
    networkCode: asString(raw["networkCode"]),
    failureReason: asString(raw["failureReason"]),
  };
}

export async function POST(request: NextRequest) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for") ?? "unknown";

    const rl = await checkRateLimit({
      key: `webhook:africas-talking:${ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const report = await parseDeliveryReport(request);

    if (!report.id || !report.status) {
      logger.warn({ report }, "Africa's Talking webhook — champs manquants");
      return NextResponse.json({ received: true });
    }

    // Le "id" doit correspondre à un SMS réellement envoyé par ce CRM —
    // c'est notre seule protection en l'absence de signature cryptographique.
    const message = await db.message.findFirst({
      where: { externalId: report.id, channel: "SMS" },
      select: { id: true, campaignId: true, status: true },
    });

    if (!message) {
      logger.warn({ id: report.id }, "Africa's Talking webhook — message inconnu");
      return NextResponse.json({ received: true });
    }

    // Idempotence : ignore les callbacks dupliqués (AT peut retenter l'envoi)
    if (message.status === "DELIVERED" || message.status === "FAILED") {
      return NextResponse.json({ received: true });
    }

    const now = new Date();
    const delivered = report.status === "Success";

    await db.message.update({
      where: { id: message.id },
      data: delivered
        ? { status: "DELIVERED", deliveredAt: now }
        : {
            status: "FAILED",
            failedAt: now,
            errorCode: report.status,
            errorMessage: report.failureReason ?? report.status,
          },
    });

    await db.messageEvent
      .create({
        data: {
          messageId: message.id,
          eventType: "delivery_report",
          eventData: {
            status: report.status,
            phoneNumber: report.phoneNumber,
            networkCode: report.networkCode,
            failureReason: report.failureReason,
          },
        },
      })
      .catch(() => {});

    if (message.campaignId) {
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
      { messageId: message.id, campaignId: message.campaignId, status: report.status },
      "Africa's Talking delivery report processed"
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Africa's Talking webhook processing failed");
    // Toujours 200 pour éviter que AT ne retente indéfiniment sur une erreur
    // interne — l'échec est déjà journalisé ci-dessus.
    return NextResponse.json({ received: true });
  }
}
