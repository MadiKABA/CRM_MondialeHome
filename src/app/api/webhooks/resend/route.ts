// Seule API route autorisée pour les callbacks externes Resend (webhooks)
import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const h = await headers();

    const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      logger.error("RESEND_WEBHOOK_SECRET non configuré");
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
    }

    const svixId = h.get("svix-id");
    const svixTimestamp = h.get("svix-timestamp");
    const svixSignature = h.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.warn("Webhook Resend sans headers de signature");
      return NextResponse.json(
        { error: "Headers de signature manquants" },
        { status: 400 }
      );
    }

    let event: { type: string; data: { email_id: string } };
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch (verificationError) {
      logger.warn({ verificationError }, "Signature webhook Resend invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const { type, data } = event;
    const resendId = data?.email_id;

    if (!resendId) {
      return NextResponse.json({ received: true });
    }

    logger.info({ type, resendId }, "Resend webhook received");

    const messageLog = await db.messageLog.findUnique({
      where: { resendId },
      select: { id: true, batchId: true, status: true, clientId: true },
    });

    if (!messageLog) {
      return NextResponse.json({ received: true });
    }

    const now = new Date();

    switch (type) {
      case "email.delivered":
        await db.messageLog.update({
          where: { id: messageLog.id },
          data: { status: "DELIVERED", deliveredAt: now },
        });
        if (messageLog.batchId) {
          await db.emailBatch.update({
            where: { id: messageLog.batchId },
            data: { deliveredCount: { increment: 1 } },
          });
        }
        break;

      case "email.opened":
        if (messageLog.status !== "OPENED") {
          await db.messageLog.update({
            where: { id: messageLog.id },
            data: { status: "OPENED", openedAt: now },
          });
          if (messageLog.batchId) {
            await db.emailBatch.update({
              where: { id: messageLog.batchId },
              data: { openedCount: { increment: 1 } },
            });
          }
        }
        break;

      case "email.clicked":
        await db.messageLog.update({
          where: { id: messageLog.id },
          data: { status: "CLICKED", clickedAt: now },
        });
        if (messageLog.batchId) {
          await db.emailBatch.update({
            where: { id: messageLog.batchId },
            data: { clickedCount: { increment: 1 } },
          });
        }
        break;

      case "email.bounced":
        await db.messageLog.update({
          where: { id: messageLog.id },
          data: { status: "BOUNCED", bouncedAt: now },
        });
        if (messageLog.batchId) {
          await db.emailBatch.update({
            where: { id: messageLog.batchId },
            data: { bouncedCount: { increment: 1 } },
          });
        }
        if (messageLog.clientId) {
          logger.warn(
            { clientId: messageLog.clientId, resendId },
            "Email bounced for client"
          );
        }
        break;

      default:
        logger.info({ type }, "Unhandled Resend webhook event");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Resend webhook processing failed");
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
