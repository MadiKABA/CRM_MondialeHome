"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  createSaleSchema,
  addPaymentSchema,
  cancelSaleSchema,
  type CreateSaleInput,
  type AddPaymentInput,
  type CancelSaleInput,
} from "../schemas/sale.schema";
import { generateSaleReference } from "./queries";
import { auditSale } from "./audit";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
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
  // 1. AUTH
  const user = await getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // 2. RATE LIMIT
  const rl = await checkRateLimit({
    key: `create_sale:${user.id}`,
    limit: RATE_LIMITS.CREATE_SALE.limit,
    windowMs: RATE_LIMITS.CREATE_SALE.windowMs,
  });
  if (!rl.allowed) {
    return { success: false, error: "Trop de requêtes. Attendez une minute." };
  }

  // 3. RBAC
  const canCreate = await hasPermission(PERMISSIONS.SALES_CREATE_ALL);
  if (!canCreate) return { success: false, error: "Permission insuffisante" };

  // 4. VALIDATION ZOD
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = parsed.data;

  try {
    // 5. GUARDS MÉTIER — vérifier que les IDs existent en DB
    if (data.clientId) {
      const clientExists = await db.client.findUnique({
        where: { id: data.clientId, deletedAt: null },
        select: { id: true },
      });
      if (!clientExists) {
        return { success: false, error: "Client introuvable" };
      }
    }

    for (const item of data.items) {
      if (item.articleId) {
        const articleExists = await db.article.findUnique({
          where: { id: item.articleId, deletedAt: null },
          select: { id: true },
        });
        if (!articleExists) {
          return {
            success: false,
            error: `Article "${item.articleName}" introuvable`,
          };
        }
      }
    }

    // 6. CALCULS CÔTÉ SERVEUR — ne jamais faire confiance aux totaux du client
    const itemsSubtotal = data.items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      return sum + Math.max(0, lineTotal);
    }, 0);

    const discountAmount = data.discountPercent
      ? Math.min((itemsSubtotal * data.discountPercent) / 100, itemsSubtotal)
      : Math.min(data.discountAmount ?? 0, itemsSubtotal);

    const totalAmount = Math.max(0, itemsSubtotal - discountAmount);
    const paidAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
    const safePaidAmount = Math.min(paidAmount, totalAmount);

    const status: "PAID" | "PARTIAL" | "UNPAID" =
      safePaidAmount >= totalAmount && totalAmount > 0
        ? "PAID"
        : safePaidAmount > 0
          ? "PARTIAL"
          : "UNPAID";

    const reference = await generateSaleReference();

    // 7. OPÉRATION DB
    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          reference,
          clientId: data.clientId ?? null,
          sellerId: user.id,
          campaignId: data.campaignId ?? null,
          status,
          totalAmount,
          paidAmount: safePaidAmount,
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

    // 8. STATS CLIENT
    if (data.clientId) {
      await recalculateClientStats(data.clientId);
    }

    // 9. AUDIT
    await auditSale(user.id, "sale.create", sale.id, {
      reference,
      totalAmount,
      status,
      clientId: data.clientId,
    });

    // 10. REVALIDATION
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
  // 1. AUTH
  const user = await getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // 2. RATE LIMIT
  const rl = await checkRateLimit({
    key: `add_payment:${user.id}`,
    limit: RATE_LIMITS.ADD_PAYMENT.limit,
    windowMs: RATE_LIMITS.ADD_PAYMENT.windowMs,
  });
  if (!rl.allowed) {
    return { success: false, error: "Trop de requêtes. Attendez une minute." };
  }

  // 3. RBAC
  const canUpdate = await hasPermission(PERMISSIONS.SALES_UPDATE_ALL);
  if (!canUpdate) return { success: false, error: "Permission insuffisante" };

  // 4. VALIDATION
  const parsed = addPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = parsed.data;

  try {
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
    if (sale.status === "REFUNDED") {
      return {
        success: false,
        error: "Impossible d'ajouter un paiement à une vente remboursée",
      };
    }

    const totalAmount = Number(sale.totalAmount);
    const currentPaid = Number(sale.paidAmount);

    // Plafonner le paiement au restant dû
    const remaining = Math.max(0, totalAmount - currentPaid);
    if (remaining === 0) {
      return { success: false, error: "Cette vente est déjà intégralement réglée" };
    }

    const safeAmount = Math.min(data.amount, remaining);
    const newPaidAmount = currentPaid + safeAmount;
    const newStatus: "PAID" | "PARTIAL" | "UNPAID" =
      newPaidAmount >= totalAmount ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "UNPAID";

    await db.$transaction([
      db.payment.create({
        data: {
          saleId: data.saleId,
          method: data.method,
          amount: safeAmount,
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

    await auditSale(user.id, "sale.payment.add", data.saleId, {
      method: data.method,
      amount: safeAmount,
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
  // 1. AUTH
  const user = await getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // 2. RATE LIMIT
  const rl = await checkRateLimit({
    key: `cancel_sale:${user.id}`,
    limit: RATE_LIMITS.CANCEL_SALE.limit,
    windowMs: RATE_LIMITS.CANCEL_SALE.windowMs,
  });
  if (!rl.allowed) {
    return { success: false, error: "Trop de requêtes. Attendez une minute." };
  }

  // 3. RBAC
  const canCancel = await hasPermission(PERMISSIONS.SALES_CANCEL_ALL);
  if (!canCancel) return { success: false, error: "Permission insuffisante" };

  // 4. VALIDATION
  const parsed = cancelSaleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = parsed.data;

  try {
    const sale = await db.sale.findUnique({
      where: { id: data.saleId, deletedAt: null },
      select: { status: true, clientId: true, reference: true, totalAmount: true },
    });

    if (!sale) return { success: false, error: "Vente introuvable" };
    if (sale.status === "CANCELLED") {
      return { success: false, error: "Cette vente est déjà annulée" };
    }
    if (sale.status === "REFUNDED") {
      return { success: false, error: "Cette vente a déjà été remboursée" };
    }

    await db.sale.update({
      where: { id: data.saleId },
      data: {
        status: "CANCELLED",
        deletedAt: new Date(),
        notes: data.reason,
      },
    });

    if (sale.clientId) await recalculateClientStats(sale.clientId);

    await auditSale(user.id, "sale.cancel", data.saleId, {
      reference: sale.reference,
      reason: data.reason,
      amount: Number(sale.totalAmount),
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
  // 1. AUTH
  const user = await getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // 2. RATE LIMIT
  const rl = await checkRateLimit({
    key: `create_client:${user.id}`,
    limit: RATE_LIMITS.CREATE_CLIENT.limit,
    windowMs: RATE_LIMITS.CREATE_CLIENT.windowMs,
  });
  if (!rl.allowed) {
    return { success: false, error: "Trop de requêtes. Attendez une minute." };
  }

  // 3. RBAC
  const canCreate = await hasPermission(PERMISSIONS.CLIENTS_CREATE_ALL);
  if (!canCreate) return { success: false, error: "Permission insuffisante" };

  try {
    const fullName = `${input.firstName.trim()} ${(input.lastName ?? "").trim()}`.trim();

    if (input.phone) {
      const exists = await db.client.findFirst({ where: { phone: input.phone } });
      if (exists) {
        return { success: false, error: "Un client avec ce numéro existe déjà" };
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

    await auditSale(user.id, "client.create_quick", client.id, {
      fullName,
      phone: input.phone,
    });

    revalidatePath("/clients");

    return { success: true, data: { id: client.id, fullName: client.fullName } };
  } catch (error) {
    logger.error({ error }, "createQuickClient failed");
    return { success: false, error: "Impossible de créer le client" };
  }
}
