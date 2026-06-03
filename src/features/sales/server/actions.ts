"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  createSaleSchema,
  addPaymentSchema,
  cancelSaleSchema,
  type CreateSaleInput,
  type AddPaymentInput,
  type CancelSaleInput,
} from "../schemas/sale.schema";
import { generateSaleReference } from "./queries";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function audit(
  userId: string,
  action: string,
  entityId?: string,
  meta?: Record<string, unknown>
) {
  const h = await headers();
  await db.auditLog.create({
    data: {
      userId,
      action,
      entity: "Sale",
      entityId,
      newValue: meta as never,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

async function recalculateClientStats(clientId: string): Promise<void> {
  const [agg, firstSale, lastSale] = await Promise.all([
    db.sale.aggregate({
      where: {
        clientId,
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    }),
    db.sale.findFirst({
      where: {
        clientId,
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      orderBy: { soldAt: "asc" },
      select: { soldAt: true },
    }),
    db.sale.findFirst({
      where: {
        clientId,
        deletedAt: null,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      orderBy: { soldAt: "desc" },
      select: { soldAt: true },
    }),
  ]);

  await db.client.update({
    where: { id: clientId },
    data: {
      totalSpent: agg._sum.totalAmount ?? 0,
      totalOrders: agg._count.id,
      averageBasket: agg._avg.totalAmount ?? 0,
      firstPurchaseAt: firstSale?.soldAt ?? null,
      lastPurchaseAt: lastSale?.soldAt ?? null,
    },
  });
}

// ── CRÉER UNE VENTE ───────────────────────────────────────────────────────────
export async function createSale(
  input: CreateSaleInput
): Promise<Result<{ id: string; reference: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.SALES_CREATE_ALL);

    const data = createSaleSchema.parse(input);

    // Calculer le sous-total des lignes
    const itemsTotal = data.items.reduce((sum, item) => {
      return sum + Math.max(0, item.unitPrice * item.quantity - item.discount);
    }, 0);

    // Remise globale — percent prime sur le montant fixe
    let discountAmount = 0;
    if (data.discountPercent) {
      discountAmount = (itemsTotal * data.discountPercent) / 100;
    } else if (data.discountAmount) {
      discountAmount = Math.min(data.discountAmount, itemsTotal);
    }

    const totalAmount = Math.max(0, itemsTotal - discountAmount);
    const paidAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);

    let status: "PENDING" | "PAID" | "PARTIAL" | "UNPAID";
    if (data.payments.length === 0) {
      status = "UNPAID";
    } else if (paidAmount >= totalAmount) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    } else {
      status = "UNPAID";
    }

    const reference = await generateSaleReference();

    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          reference,
          clientId: data.clientId ?? null,
          sellerId: user.id,
          campaignId: data.campaignId ?? null,
          status,
          totalAmount,
          paidAmount,
          discountAmount,
          discountPercent: data.discountPercent ?? null,
          notes: data.notes || null,
          soldAt: data.soldAt,
        },
      });

      await tx.saleItem.createMany({
        data: data.items.map((item) => ({
          saleId: newSale.id,
          articleId: item.articleId ?? null,
          articleName: item.articleName,
          articleRef: item.articleRef,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          totalPrice: Math.max(0, item.unitPrice * item.quantity - item.discount),
        })),
      });

      if (data.payments.length > 0) {
        await tx.payment.createMany({
          data: data.payments.map((p) => ({
            saleId: newSale.id,
            method: p.method,
            amount: p.amount,
            reference: p.reference || null,
            notes: p.notes || null,
          })),
        });
      }

      return newSale;
    });

    if (data.clientId) {
      await recalculateClientStats(data.clientId);
    }

    await audit(user.id, "sale.create", sale.id, {
      reference,
      totalAmount,
      status,
      clientId: data.clientId,
    });

    revalidatePath("/sales");
    if (data.clientId) revalidatePath(`/clients/${data.clientId}`);

    return { success: true, data: { id: sale.id, reference } };
  } catch (error) {
    logger.error({ error }, "createSale failed");
    return { success: false, error: "Une erreur est survenue lors de l'enregistrement" };
  }
}

// ── AJOUTER UN PAIEMENT ───────────────────────────────────────────────────────
export async function addPayment(input: AddPaymentInput): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.SALES_UPDATE_ALL);

    const data = addPaymentSchema.parse(input);

    const sale = await db.sale.findUnique({
      where: { id: data.saleId, deletedAt: null },
      select: { totalAmount: true, paidAmount: true, status: true, clientId: true },
    });

    if (!sale) return { success: false, error: "Vente introuvable" };
    if (sale.status === "CANCELLED") {
      return {
        success: false,
        error: "Impossible d'ajouter un paiement à une vente annulée",
      };
    }

    const newPaidAmount = Number(sale.paidAmount) + data.amount;
    const totalAmount = Number(sale.totalAmount);
    const newStatus: "PAID" | "PARTIAL" | "UNPAID" =
      newPaidAmount >= totalAmount ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "UNPAID";

    await db.$transaction([
      db.payment.create({
        data: {
          saleId: data.saleId,
          method: data.method,
          amount: data.amount,
          reference: data.reference || null,
          notes: data.notes || null,
        },
      }),
      db.sale.update({
        where: { id: data.saleId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      }),
    ]);

    if (sale.clientId) await recalculateClientStats(sale.clientId);

    await audit(user.id, "sale.payment.add", data.saleId, {
      method: data.method,
      amount: data.amount,
      newStatus,
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${data.saleId}`);

    return { success: true };
  } catch (error) {
    logger.error({ error }, "addPayment failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── ANNULER UNE VENTE ─────────────────────────────────────────────────────────
export async function cancelSale(input: CancelSaleInput): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.SALES_CANCEL_ALL);

    const data = cancelSaleSchema.parse(input);

    const sale = await db.sale.findUnique({
      where: { id: data.saleId, deletedAt: null },
      select: { status: true, clientId: true, reference: true },
    });

    if (!sale) return { success: false, error: "Vente introuvable" };
    if (sale.status === "CANCELLED") {
      return { success: false, error: "Cette vente est déjà annulée" };
    }

    await db.sale.update({
      where: { id: data.saleId },
      data: {
        status: "CANCELLED",
        notes: data.reason,
        deletedAt: new Date(),
      },
    });

    if (sale.clientId) await recalculateClientStats(sale.clientId);

    await audit(user.id, "sale.cancel", data.saleId, {
      reference: sale.reference,
      reason: data.reason,
    });

    revalidatePath("/sales");
    if (sale.clientId) revalidatePath(`/clients/${sale.clientId}`);

    return { success: true };
  } catch (error) {
    logger.error({ error }, "cancelSale failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── CRÉATION RAPIDE CLIENT (depuis le formulaire vente) ───────────────────────
export async function createQuickClient(input: {
  firstName: string;
  lastName?: string;
  phone?: string;
}): Promise<Result<{ id: string; fullName: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_CREATE_ALL);

    const fullName = `${input.firstName.trim()} ${(input.lastName ?? "").trim()}`.trim();

    if (input.phone) {
      const exists = await db.client.findFirst({ where: { phone: input.phone } });
      if (exists) {
        return {
          success: false,
          error: "Un client avec ce numéro existe déjà",
        };
      }
    }

    const count = await db.client.count();
    const reference = `MH-${String(count + 1).padStart(5, "0")}`;

    const client = await db.client.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
        fullName,
        phone: input.phone || null,
        reference,
        createdById: user.id,
      },
    });

    revalidatePath("/clients");

    return { success: true, data: { id: client.id, fullName: client.fullName } };
  } catch (error) {
    logger.error({ error }, "createQuickClient failed");
    return { success: false, error: "Impossible de créer le client" };
  }
}
