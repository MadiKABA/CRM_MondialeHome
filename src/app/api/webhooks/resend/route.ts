// Seule API route autorisée pour les callbacks externes Resend (webhooks)
import { type NextRequest, NextResponse } from "next/server";
import { Prisma, type MessageStatus } from "@prisma/client";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recomputeBatchStats } from "@/features/campaigns/lib/stats";

interface ResendEvent {
  type: string;
  data?: { email_id?: string };
}

// Rang de progression : le statut le plus élevé gagne
const RANK: Partial<Record<MessageStatus, number>> = {
  PENDING: 0,
  SENT: 1,
  DELIVERED: 2,
  OPENED: 3,
  CLICKED: 4,
};
// Statuts définitifs : plus aucune transition
const FINAL: MessageStatus[] = ["BOUNCED", "COMPLAINED", "FAILED"];

const EVENT_TARGET: Record<string, MessageStatus> = {
  "email.delivered": "DELIVERED",
  "email.opened": "OPENED",
  "email.clicked": "CLICKED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
};

type Outcome = "applied" | "ignored_lower_status" | "ignored_final" | "unhandled";

async function applyEvent(
  messageId: string,
  current: MessageStatus,
  target: MessageStatus
): Promise<Outcome> {
  if (FINAL.includes(current)) return "ignored_final";

  const isTerminalTarget = target === "BOUNCED" || target === "COMPLAINED";
  if (!isTerminalTarget && (RANK[target] ?? 0) <= (RANK[current] ?? 0)) {
    return "ignored_lower_status";
  }

  const now = new Date();
  // Les horodatages manquants sont complétés (événements reçus dans le désordre)
  const reached = (s: MessageStatus) => (RANK[target] ?? 0) >= (RANK[s] ?? 99);
  await db.messageLog.update({
    where: { id: messageId },
    data: {
      status: target,
      ...(reached("DELIVERED") && { deliveredAt: now }),
      ...(reached("OPENED") && { openedAt: now }),
      ...(reached("CLICKED") && { clickedAt: now }),
      ...(target === "BOUNCED" && { bouncedAt: now }),
    },
  });
  return "applied";
}

export async function POST(request: NextRequest) {
  // Corps brut AVANT toute analyse : requis pour la signature svix
  const body = await request.text();

  const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    logger.error("RESEND_WEBHOOK_SECRET non configuré");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn("Webhook Resend sans headers de signature");
    return NextResponse.json(
      { error: "Headers de signature manquants" },
      { status: 400 }
    );
  }

  let event: ResendEvent;
  try {
    event = new Webhook(webhookSecret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendEvent;
  } catch (err) {
    logger.warn({ err }, "Signature webhook Resend invalide");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const type = event.type;
  const resendId = event.data?.email_id ?? null;

  // Idempotence : le svix-id est unique par événement (conservé lors des relances)
  try {
    await db.webhookEvent.create({
      data: { svixId, type, resendId, result: "processing" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      logger.info({ type, resendId, svixId }, "Resend webhook duplicate ignored");
      return NextResponse.json({ received: true, duplicate: true });
    }
    logger.error({ err }, "Resend webhook: enregistrement de l'événement impossible");
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  const finish = async (result: string) => {
    await db.webhookEvent.update({ where: { svixId }, data: { result } }).catch(() => {});
    logger.info({ type, resendId, svixId, result }, "Resend webhook processed");
  };

  try {
    const target = EVENT_TARGET[type];
    if (!resendId || !target) {
      await finish("unhandled");
      return NextResponse.json({ received: true });
    }

    const messageLog = await db.messageLog.findUnique({
      where: { resendId },
      select: { id: true, batchId: true, status: true },
    });

    if (!messageLog) {
      logger.warn({ type, resendId }, "Resend webhook: message introuvable");
      await finish("message_not_found");
      return NextResponse.json({ received: true });
    }

    const outcome = await applyEvent(messageLog.id, messageLog.status, target);

    // Compteurs recalculés depuis les logs : naturellement idempotent
    if (outcome === "applied" && messageLog.batchId) {
      await recomputeBatchStats(messageLog.batchId);
    }

    await finish(outcome);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ err, type, resendId }, "Resend webhook processing failed");
    // Libère le svix-id pour que la relance de Resend soit retraitée
    await db.webhookEvent.delete({ where: { svixId } }).catch(() => {});
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
