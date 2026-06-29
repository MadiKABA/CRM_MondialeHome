"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission, getServerSession } from "@/lib/permissions/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculateRFM } from "../calculator";
import { getAllClientsRFMData, getClientRFMData } from "./queries";
import type { RFMBatchResult, RFMProfile } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Recalculer le RFM d'un client — appelé après chaque vente ────────────────
// Silencieux : ne fait jamais échouer la vente parente
export async function recalculateClientRFM(clientId: string): Promise<void> {
  try {
    const data = await getClientRFMData(clientId);
    if (!data) return;

    const result = calculateRFM(data);

    await db.client.update({
      where: { id: clientId },
      data: {
        rfmScore: result.profile,
        rfmRecency: result.r,
        rfmFrequency: result.f,
        rfmMonetary: result.m,
        rfmCalculatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error({ error, clientId }, "Failed to recalculate client RFM");
  }
}

// ── Recalcul interne sans auth — pour seed et worker ─────────────────────────
export async function runFullRFMCalculation(): Promise<RFMBatchResult> {
  const startTime = Date.now();
  const result: RFMBatchResult = {
    processed: 0,
    updated: 0,
    errors: 0,
    duration: 0,
    breakdown: {
      champions: 0,
      loyal: 0,
      potential: 0,
      new_customers: 0,
      at_risk: 0,
      lost: 0,
      others: 0,
    },
  };

  for await (const batch of getAllClientsRFMData(500)) {
    const updates = batch.map((data) => calculateRFM(data));

    try {
      await db.$transaction(
        updates.map((rfm) =>
          db.client.update({
            where: { id: rfm.clientId },
            data: {
              rfmScore: rfm.profile,
              rfmRecency: rfm.r,
              rfmFrequency: rfm.f,
              rfmMonetary: rfm.m,
              rfmCalculatedAt: new Date(),
            },
          })
        )
      );

      result.processed += batch.length;
      result.updated += updates.length;
      for (const rfm of updates) result.breakdown[rfm.profile]++;
    } catch (batchError) {
      result.errors += batch.length;
      logger.error({ batchError }, "RFM batch update failed");
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Recalcul global — réservé aux admins ─────────────────────────────────────
export async function recalculateAllRFM(): Promise<Result<RFMBatchResult>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Non authentifié" };

    const rl = await checkRateLimit({
      key: `rfm:recalculate_all:${session.user.id}`,
      limit: 1,
      windowMs: 300_000,
    });
    if (!rl.allowed) {
      return {
        success: false,
        error: "Recalcul déjà en cours. Attendez 5 minutes.",
      };
    }

    await checkPermission("clients.update.all");

    const result = await runFullRFMCalculation();

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "rfm.recalculate_all",
        entity: "Client",
        newValue: JSON.parse(JSON.stringify(result)),
        status: "success",
      },
    });

    logger.info(
      { result },
      `RFM recalculated for ${result.processed} clients in ${result.duration}ms`
    );

    revalidatePath("/clients");
    revalidatePath("/segments");

    return { success: true, data: result };
  } catch (error) {
    logger.error({ error }, "recalculateAllRFM failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── Recalcul d'un seul client — depuis sa fiche ───────────────────────────────
export async function recalculateSingleClientRFM(
  clientId: string
): Promise<Result<{ profile: RFMProfile; r: number; f: number; m: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Non authentifié" };

    await checkPermission("clients.update.all");

    const rl = await checkRateLimit({
      key: `rfm:single:${session.user.id}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    const data = await getClientRFMData(clientId);
    if (!data) return { success: false, error: "Client introuvable" };

    const rfm = calculateRFM(data);

    await db.client.update({
      where: { id: clientId },
      data: {
        rfmScore: rfm.profile,
        rfmRecency: rfm.r,
        rfmFrequency: rfm.f,
        rfmMonetary: rfm.m,
        rfmCalculatedAt: new Date(),
      },
    });

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      data: { profile: rfm.profile, r: rfm.r, f: rfm.f, m: rfm.m },
    };
  } catch (error) {
    logger.error({ error }, "recalculateSingleClientRFM failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}
