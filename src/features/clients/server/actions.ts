"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  clientSchema,
  importRowSchema,
  type ClientInput,
  type ImportRow,
} from "../schemas/client.schema";
import type { ImportResult } from "../types";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function audit(
  userId: string,
  action: string,
  entityId?: string,
  meta?: Prisma.InputJsonObject
) {
  const h = await headers();
  await db.auditLog.create({
    data: {
      userId,
      action,
      entity: "Client",
      entityId,
      newValue: meta,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

async function generateReference(): Promise<string> {
  const count = await db.client.count();
  return `MH-${String(count + 1).padStart(5, "0")}`;
}

// ── CRÉER ────────────────────────────────────────────────────────────────────
export async function createClient(input: ClientInput): Promise<Result<{ id: string }>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_CREATE_ALL);

    const data = clientSchema.parse(input);

    if (data.phone) {
      const dup = await db.client.findFirst({
        where: { phone: data.phone, deletedAt: null },
        select: { id: true },
      });
      if (dup) return { success: false, error: "Un client avec ce numéro existe déjà" };
    }

    const reference = await generateReference();
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");

    const client = await db.client.create({
      data: {
        reference,
        firstName: data.firstName,
        lastName: data.lastName || null,
        fullName,
        gender: data.gender ?? null,
        birthDate: data.birthDate ?? null,
        phone: data.phone || null,
        phoneSecondary: data.phoneSecondary || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        district: data.district || null,
        region: data.region || null,
        language: data.language,
        preferredChannel: data.preferredChannel ?? null,
        source: data.source || null,
        sourceDetails: data.sourceDetails || null,
        smsConsent: data.smsConsent,
        whatsappConsent: data.whatsappConsent,
        emailConsent: data.emailConsent,
        notes: data.notes || null,
        tags: data.tags ?? [],
        status: "ACTIVE",
        createdById: user.id,
      },
      select: { id: true },
    });

    await audit(user.id, "client.create", client.id, { reference });
    revalidatePath("/clients");

    return { success: true, data: { id: client.id } };
  } catch (error) {
    logger.error({ error }, "Failed to create client");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── MODIFIER ─────────────────────────────────────────────────────────────────
export async function updateClient(
  clientId: string,
  input: ClientInput
): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_UPDATE_ALL);

    const data = clientSchema.parse(input);
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");

    if (data.phone) {
      const dup = await db.client.findFirst({
        where: { phone: data.phone, deletedAt: null, NOT: { id: clientId } },
        select: { id: true },
      });
      if (dup)
        return {
          success: false,
          error: "Ce numéro est déjà utilisé par un autre client",
        };
    }

    await db.client.update({
      where: { id: clientId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        fullName,
        gender: data.gender ?? null,
        birthDate: data.birthDate ?? null,
        phone: data.phone || null,
        phoneSecondary: data.phoneSecondary || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        district: data.district || null,
        region: data.region || null,
        language: data.language,
        preferredChannel: data.preferredChannel ?? null,
        source: data.source || null,
        sourceDetails: data.sourceDetails || null,
        smsConsent: data.smsConsent,
        whatsappConsent: data.whatsappConsent,
        emailConsent: data.emailConsent,
        notes: data.notes || null,
        tags: data.tags ?? [],
      },
    });

    await audit(user.id, "client.update", clientId);
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to update client");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── SUPPRIMER (soft delete) ───────────────────────────────────────────────────
export async function deleteClient(clientId: string): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_DELETE_ALL);

    await db.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date(), status: "DELETED" },
    });

    await audit(user.id, "client.delete", clientId);
    revalidatePath("/clients");

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete client");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── TOGGLE VIP ────────────────────────────────────────────────────────────────
export async function toggleClientVip(clientId: string, isVip: boolean): Promise<Result> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_UPDATE_ALL);

    await db.client.update({ where: { id: clientId }, data: { isVip } });

    await audit(user.id, isVip ? "client.vip.add" : "client.vip.remove", clientId);
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to toggle VIP");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── EXPORT (récupère les données pour export côté client) ─────────────────────
export async function getClientsExportData(
  filters: Partial<{
    search: string;
    city: string;
    status: "ACTIVE" | "INACTIVE" | "UNSUBSCRIBED" | "BLACKLISTED";
  }>
): Promise<Result<unknown[]>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_EXPORT_ALL);

    const { getClientsForExport } = await import("./queries");
    const clients = await getClientsForExport(filters);

    await audit(user.id, "client.export", undefined, { count: clients.length });

    return { success: true, data: clients };
  } catch (error) {
    logger.error({ error }, "Failed to export clients");
    return { success: false, error: "Une erreur est survenue lors de l'export" };
  }
}

// ── IMPORT CSV/EXCEL ──────────────────────────────────────────────────────────
export async function importClients(rows: ImportRow[]): Promise<Result<ImportResult>> {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    await checkPermission(PERMISSIONS.CLIENTS_IMPORT_ALL);

    if (rows.length === 0) return { success: false, error: "Aucune ligne à importer" };
    if (rows.length > 5000)
      return { success: false, error: "Maximum 5000 lignes par import" };

    const result: ImportResult = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    };

    const existingPhones = new Set(
      (
        await db.client.findMany({
          where: { deletedAt: null, phone: { not: null } },
          select: { phone: true },
        })
      ).map((c) => c.phone!)
    );

    const baseCount = await db.client.count();
    const toCreate: Prisma.ClientCreateManyInput[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const parsed = importRowSchema.safeParse(row);
      if (!parsed.success) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          error: parsed.error.issues.map((e) => e.message).join(", "),
        });
        continue;
      }

      const data = parsed.data;

      let phone = data.phone;
      if (phone && !phone.startsWith("+221")) {
        const cleaned = phone.replace(/[\s\-\.]/g, "").replace(/^0/, "");
        phone = cleaned.length === 9 ? `+221${cleaned}` : undefined;
      }

      if (phone && existingPhones.has(phone)) {
        result.skipped++;
        continue;
      }

      if (phone) existingPhones.add(phone);

      const refNum = baseCount + toCreate.length + 1;
      toCreate.push({
        reference: `MH-${String(refNum).padStart(5, "0")}`,
        firstName: data.firstName,
        lastName: data.lastName || null,
        fullName: [data.firstName, data.lastName].filter(Boolean).join(" "),
        phone: phone || null,
        email: data.email || null,
        city: data.city || null,
        district: data.district || null,
        source: data.source || "import",
        notes: data.notes || null,
        status: "ACTIVE",
        createdById: user.id,
      });
    }

    const BATCH = 100;
    for (let i = 0; i < toCreate.length; i += BATCH) {
      const batch = toCreate.slice(i, i + BATCH);
      await db.client.createMany({ data: batch, skipDuplicates: true });
      result.created += batch.length;
    }

    await audit(user.id, "client.import", undefined, {
      total: result.total,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    });

    revalidatePath("/clients");
    return { success: true, data: result };
  } catch (error) {
    logger.error({ error }, "Failed to import clients");
    return { success: false, error: "Une erreur est survenue lors de l'import" };
  }
}
