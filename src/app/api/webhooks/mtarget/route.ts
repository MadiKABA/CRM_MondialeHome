// Webhook DLR (accusé de réception) Mtarget.
// Mtarget nous renvoie le remoteid que nous avons fourni à l'envoi (= Message.id),
// ce qui permet de retrouver le message sans dépendre uniquement du ticket Mtarget.
import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { maskPhoneNumber } from "@/lib/sms/validator";

interface MtargetDlrPayload {
  msgId: string | null;
  status: string | null;
  destinationAddress: string | null;
  remoteId: string | null;
  deliveryDateTime: string | null;
}

// Rang de priorité — un statut ne peut jamais être écrasé par un statut de rang inférieur.
const STATUS_RANK: Partial<Record<string, number>> = {
  SENT: 1,
  FAILED: 2,
  DELIVERED: 3,
};

function mapMtargetStatus(status: string): "SENT" | "DELIVERED" | "FAILED" | null {
  switch (status) {
    case "2":
      return "SENT";
    case "3":
      return "DELIVERED";
    case "4":
    case "6":
      return "FAILED";
    default:
      // 0 (waiting) et 1 (in progress) — pas de mise à jour
      return null;
  }
}

async function parseDlrPayload(request: NextRequest): Promise<MtargetDlrPayload> {
  const formData = await request.formData();
  const asString = (key: string): string | null => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value : null;
  };

  return {
    msgId: asString("MsgId"),
    status: asString("Status"),
    destinationAddress: asString("DestinationAdress"),
    remoteId: asString("remoteid"),
    deliveryDateTime: asString("DeliveryDateTime"),
  };
}

function parseDeliveryDate(value: string | null): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function POST(request: NextRequest) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for") ?? "unknown";

    const rl = await checkRateLimit({
      key: `webhook:mtarget:${ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ received: true });
    }

    const payload = await parseDlrPayload(request);

    if (!payload.status) {
      logger.warn("Mtarget webhook — Status manquant");
      return NextResponse.json({ received: true });
    }

    const mappedStatus = mapMtargetStatus(payload.status);
    if (!mappedStatus) {
      return NextResponse.json({ received: true });
    }

    // Priorité au remoteid (= Message.id, direct) — fallback sur le ticket (externalId).
    const message = payload.remoteId
      ? await db.message.findUnique({
          where: { id: payload.remoteId },
          select: { id: true, status: true, campaignId: true },
        })
      : null;

    const resolvedMessage =
      message ??
      (payload.msgId
        ? await db.message.findFirst({
            where: { externalId: payload.msgId, channel: "SMS" },
            select: { id: true, status: true, campaignId: true },
          })
        : null);

    if (!resolvedMessage) {
      logger.warn(
        { remoteid: payload.remoteId, msgId: payload.msgId },
        "Mtarget webhook — message inconnu"
      );
      return NextResponse.json({ received: true });
    }

    const currentRank = STATUS_RANK[resolvedMessage.status] ?? 0;
    const newRank = STATUS_RANK[mappedStatus] ?? 0;
    if (newRank <= currentRank) {
      return NextResponse.json({ received: true });
    }

    await db.message.update({
      where: { id: resolvedMessage.id },
      data: {
        status: mappedStatus,
        ...(mappedStatus === "DELIVERED" && {
          deliveredAt: parseDeliveryDate(payload.deliveryDateTime),
        }),
        ...(mappedStatus === "FAILED" && {
          failedAt: new Date(),
          errorMessage: `Mtarget status ${payload.status}`,
        }),
      },
    });

    if (resolvedMessage.campaignId && mappedStatus === "DELIVERED") {
      await db.campaign
        .update({
          where: { id: resolvedMessage.campaignId },
          data: { totalDelivered: { increment: 1 } },
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
    } else if (resolvedMessage.campaignId && mappedStatus === "FAILED") {
      await db.campaign
        .update({
          where: { id: resolvedMessage.campaignId },
          data: { totalFailed: { increment: 1 } },
        })
        .catch(() => {});
    }

    logger.info(
      {
        msgId: payload.msgId,
        status: payload.status,
        remoteid: payload.remoteId,
        to: payload.destinationAddress
          ? maskPhoneNumber(payload.destinationAddress)
          : null,
      },
      "Mtarget DLR processed"
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Mtarget webhook processing failed");
    // Toujours 200 — Mtarget ne doit jamais retenter indéfiniment sur une erreur interne.
    return NextResponse.json({ received: true });
  }
}
