"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditSale } from "./audit";
import { recalculateClientRFM } from "@/features/rfm/server/actions";
import { invalidateDashboardAfterSale } from "@/features/dashboard/server/actions";
import { triggerProductSegmentsRefresh } from "@/server/workers/segment.worker";
import type { MappedSaleGroup } from "../lib/sales-import-mapper";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

const importedSaleSchema = z.object({
  saleReference: z.string().min(1).max(100),
  date: z.coerce.date(),
  clientLastName: z.string().max(50).nullable(),
  clientFirstName: z.string().max(50).nullable(),
  clientPhone: z
    .string()
    .regex(/^\+221[0-9]{9}$/)
    .nullable(),
  paymentMethod: z.enum([
    "WAVE",
    "ORANGE_MONEY",
    "FREE_MONEY",
    "CASH",
    "BANK_TRANSFER",
    "CREDIT",
    "CARD",
    "CHECK",
    "OTHER",
  ]),
  paidAmount: z.number().min(0),
  discountPercent: z.number().min(0).max(100).nullable(),
  status: z.enum(["PENDING", "PAID", "PARTIAL", "UNPAID", "CANCELLED", "REFUNDED"]),
  notes: z.string().max(1000).nullable(),
  sellerName: z.string().max(100).nullable(),
  campaignName: z.string().max(100).nullable(),
  items: z
    .array(
      z.object({
        articleRef: z.string().nullable(),
        articleName: z.string().min(1),
        unitPrice: z.number().min(0),
        quantity: z.number().int().min(1),
        lineDiscount: z.number().min(0),
        totalPrice: z.number().min(0),
      })
    )
    .min(1),
});

export interface ImportSalesResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  clientsCreated: number;
  totalRevenue: number;
  errorDetails: Array<{ saleRef: string; error: string }>;
}

export async function importSales(sales: unknown): Promise<Result<ImportSalesResult>> {
  // 1. AUTH
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Non authentifié" };

  // 2. RATE LIMIT
  const rl = await checkRateLimit({
    key: `import_sales:${session.user.id}`,
    limit: RATE_LIMITS.IMPORT_SALES.limit,
    windowMs: RATE_LIMITS.IMPORT_SALES.windowMs,
  });
  if (!rl.allowed) {
    return {
      success: false,
      error: `Import limité à ${RATE_LIMITS.IMPORT_SALES.limit} fois toutes les 5 minutes.`,
    };
  }

  // 3. RBAC
  const canCreate = await hasPermission(PERMISSIONS.SALES_CREATE_ALL);
  if (!canCreate) return { success: false, error: "Permission insuffisante" };

  // 4. VALIDATION DU FORMAT
  if (!Array.isArray(sales)) {
    return { success: false, error: "Format invalide" };
  }
  if (sales.length === 0) return { success: false, error: "Aucune vente à importer" };
  if (sales.length > 2000) {
    return { success: false, error: "Maximum 2000 ventes par import" };
  }

  try {
    const typedSales = sales as MappedSaleGroup[];
    const validSales = typedSales.filter((s) => s.isValid);
    if (validSales.length === 0) {
      return { success: false, error: "Aucune vente valide. Corrigez les erreurs." };
    }

    const result: ImportSalesResult = {
      total: typedSales.length,
      created: 0,
      skipped: typedSales.length - validSales.length,
      errors: 0,
      clientsCreated: 0,
      totalRevenue: 0,
      errorDetails: [],
    };

    // Pré-charger les références existantes
    const existingRefs = new Set(
      (
        await db.sale.findMany({
          where: { reference: { in: validSales.map((s) => s.saleReference) } },
          select: { reference: true },
        })
      ).map((s) => s.reference)
    );

    // Pré-charger les articles par référence
    const articleRefs = [
      ...new Set(
        validSales
          .flatMap((s) => s.items.map((i) => i.articleRef))
          .filter((r): r is string => r !== null)
      ),
    ];
    const knownArticles =
      articleRefs.length > 0
        ? await db.article.findMany({
            where: { reference: { in: articleRefs }, deletedAt: null },
            select: { id: true, reference: true },
          })
        : [];
    const articleMap = new Map(knownArticles.map((a) => [a.reference, a.id]));

    // Pré-charger les clients par téléphone
    const phones = [
      ...new Set(
        validSales.map((s) => s.clientPhone).filter((p): p is string => p !== null)
      ),
    ];
    const knownClients =
      phones.length > 0
        ? await db.client.findMany({
            where: { phone: { in: phones }, deletedAt: null },
            select: { id: true, phone: true },
          })
        : [];
    const clientPhoneMap = new Map(knownClients.map((c) => [c.phone!, c.id]));

    // Pré-charger les vendeurs par nom
    const sellerNames = [
      ...new Set(
        validSales.map((s) => s.sellerName).filter((n): n is string => n !== null)
      ),
    ];
    const knownSellers =
      sellerNames.length > 0
        ? await db.user.findMany({
            where: { name: { in: sellerNames, mode: "insensitive" }, isActive: true },
            select: { id: true, name: true },
          })
        : [];
    const sellerMap = new Map(knownSellers.map((u) => [u.name.toLowerCase(), u.id]));

    const clientsToRecalc = new Set<string>();
    const BATCH_SIZE = 50;

    for (let i = 0; i < validSales.length; i += BATCH_SIZE) {
      const batch = validSales.slice(i, i + BATCH_SIZE);

      for (const sale of batch) {
        try {
          // Validation Zod côté serveur — ne jamais faire confiance au mapping client
          const parsed = importedSaleSchema.safeParse(sale);
          if (!parsed.success) {
            result.errors++;
            result.errorDetails.push({
              saleRef: sale.saleReference,
              error: parsed.error.issues.map((e) => e.message).join(", "),
            });
            continue;
          }

          const data = parsed.data;

          if (existingRefs.has(data.saleReference)) {
            result.skipped++;
            continue;
          }

          // Résoudre ou créer le client
          let clientId: string | null = null;
          if (data.clientPhone) {
            clientId = clientPhoneMap.get(data.clientPhone) ?? null;
            if (!clientId && (data.clientFirstName || data.clientLastName)) {
              const firstName = data.clientFirstName ?? data.clientLastName ?? "Client";
              const lastName = data.clientFirstName
                ? (data.clientLastName ?? null)
                : null;
              const fullName = [firstName, lastName].filter(Boolean).join(" ");
              const newClient = await db.client.create({
                data: {
                  firstName,
                  lastName,
                  fullName,
                  phone: data.clientPhone,
                  status: "ACTIVE",
                  source: "import_ventes",
                },
              });
              clientId = newClient.id;
              clientPhoneMap.set(data.clientPhone, clientId);
              result.clientsCreated++;
            }
          }

          // Recalcul des totaux côté serveur
          const itemsSubtotal = data.items.reduce(
            (sum, item) => sum + Math.max(0, item.totalPrice),
            0
          );
          const discountAmount = data.discountPercent
            ? (itemsSubtotal * data.discountPercent) / 100
            : 0;
          const totalAmount = Math.max(0, itemsSubtotal - discountAmount);

          // Recalcul du statut selon le montant réel
          let status = data.status;
          if (totalAmount > 0) {
            if (data.paidAmount >= totalAmount) status = "PAID";
            else if (data.paidAmount > 0) status = "PARTIAL";
            else if (status !== "CANCELLED") status = "UNPAID";
          }

          const sellerId = data.sellerName
            ? (sellerMap.get(data.sellerName.toLowerCase()) ?? null)
            : null;

          await db.$transaction(async (tx) => {
            const newSale = await tx.sale.create({
              data: {
                reference: data.saleReference,
                clientId,
                sellerId,
                status,
                totalAmount,
                paidAmount: Math.min(data.paidAmount, totalAmount),
                discountAmount,
                discountPercent: data.discountPercent,
                notes: data.notes,
                soldAt: data.date,
              },
            });

            await tx.saleItem.createMany({
              data: data.items.map((item) => ({
                saleId: newSale.id,
                articleId: item.articleRef
                  ? (articleMap.get(item.articleRef) ?? null)
                  : null,
                articleName: item.articleName,
                articleRef: item.articleRef ?? "IMPORT",
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discount: item.lineDiscount,
                totalPrice: item.totalPrice,
              })),
            });

            if (data.paidAmount > 0) {
              await tx.payment.create({
                data: {
                  saleId: newSale.id,
                  method: data.paymentMethod,
                  amount: Math.min(data.paidAmount, totalAmount),
                  notes: "Importé depuis ancien système",
                },
              });
            }
          });

          existingRefs.add(data.saleReference);
          result.created++;
          result.totalRevenue += totalAmount;
          if (clientId) clientsToRecalc.add(clientId);
        } catch (err) {
          result.errors++;
          result.errorDetails.push({
            saleRef: sale.saleReference,
            error: err instanceof Error ? err.message : "Erreur inconnue",
          });
        }
      }
    }

    // Recalculer les stats et le score RFM de tous les clients affectés
    for (const clientId of clientsToRecalc) {
      await recalculateClientStats(clientId);
      await recalculateClientRFM(clientId);
    }

    // Segments produit : un seul rafraîchissement pour tout l'import (tâche de fond)
    if (result.created > 0) {
      await triggerProductSegmentsRefresh("sales.import");
    }

    // Audit avec IP/userAgent via le helper centralisé
    await auditSale(session.user.id, "sales.import", undefined, {
      total: result.total,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
      clientsCreated: result.clientsCreated,
    });

    revalidatePath("/sales");
    revalidatePath("/clients");
    void invalidateDashboardAfterSale();
    void invalidateDashboardAfterSale("year");
    void invalidateDashboardAfterSale("quarter");

    return { success: true, data: result };
  } catch (error) {
    logger.error({ error }, "importSales failed");
    return { success: false, error: "Une erreur est survenue lors de l'import" };
  }
}

export async function getExistingSaleReferences(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const sales = await db.sale.findMany({
    select: { reference: true },
    take: 50_000,
  });
  return sales.map((s) => s.reference);
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
