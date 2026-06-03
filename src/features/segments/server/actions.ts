"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission, requireAuth } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createGroupSchema,
  createSegmentSchema,
  addMembersSchema,
  removeMemberSchema,
  deleteSegmentSchema,
  type CreateGroupInput,
  type CreateSegmentInput,
  type AddMembersInput,
} from "../schemas/segment.schema";
import {
  refreshDynamicSegment,
  previewSegmentCriteria,
  getClientsNotInGroup,
} from "./queries";
import type { CriteriaGroupDTO, SegmentPreviewResult } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
  return `${base}-${Date.now().toString(36)}`;
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
      entity: "Segment",
      entityId: entityId ?? null,
      newValue: (meta ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

// ── CRÉER UN GROUPE STATIQUE ──────────────────────────────────────────────────

export async function createGroup(
  input: CreateGroupInput
): Promise<Result<{ id: string }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const rateCheck = await checkRateLimit({
      key: `create_segment:${userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return { success: false, error: "Trop de requêtes. Attendez une minute." };
    }

    await checkPermission(PERMISSIONS.SEGMENTS_CREATE_ALL);

    const data = createGroupSchema.parse(input);

    const segment = await db.segment.create({
      data: {
        name: data.name,
        slug: toSlug(data.name),
        description: data.description || null,
        color: data.color,
        icon: data.icon || null,
        type: "STATIC",
        criteria: {},
        memberCount: 0,
        createdById: userId,
      },
    });

    await audit(userId, "segment.group.create", segment.id, { name: data.name });

    revalidatePath("/segments");
    return { success: true, data: { id: segment.id } };
  } catch (error) {
    logger.error({ error }, "Failed to create group");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── CRÉER UN SEGMENT DYNAMIQUE ────────────────────────────────────────────────

export async function createDynamicSegment(
  input: CreateSegmentInput
): Promise<Result<{ id: string; memberCount: number }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const rateCheck = await checkRateLimit({
      key: `create_segment:${userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return { success: false, error: "Trop de requêtes. Attendez une minute." };
    }

    await checkPermission(PERMISSIONS.SEGMENTS_CREATE_ALL);

    const data = createSegmentSchema.parse(input);

    const segment = await db.segment.create({
      data: {
        name: data.name,
        slug: toSlug(data.name),
        description: data.description || null,
        color: data.color,
        icon: data.icon || null,
        type: "DYNAMIC",
        criteria: data.criteria as Prisma.InputJsonValue,
        autoRefresh: data.autoRefresh,
        memberCount: 0,
        createdById: userId,
      },
    });

    const count = await refreshDynamicSegment(segment.id);

    await audit(userId, "segment.dynamic.create", segment.id, {
      name: data.name,
      memberCount: count,
    });

    revalidatePath("/segments");
    return { success: true, data: { id: segment.id, memberCount: count } };
  } catch (error) {
    logger.error({ error }, "Failed to create dynamic segment");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── AJOUTER DES MEMBRES À UN GROUPE ──────────────────────────────────────────

export async function addMembersToGroup(
  input: AddMembersInput
): Promise<Result<{ added: number }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await checkPermission(PERMISSIONS.SEGMENTS_MANAGE_MEMBERS_ALL);

    const data = addMembersSchema.parse(input);

    const group = await db.segment.findUnique({
      where: { id: data.groupId },
      select: { type: true, name: true },
    });
    if (!group) return { success: false, error: "Groupe introuvable" };
    if (group.type !== "STATIC") {
      return {
        success: false,
        error: "Impossible d'ajouter manuellement dans un segment dynamique",
      };
    }

    const validClients = await db.client.findMany({
      where: { id: { in: data.clientIds }, deletedAt: null },
      select: { id: true },
    });
    const validIds = validClients.map((c) => c.id);

    if (validIds.length === 0) {
      return { success: false, error: "Aucun client valide trouvé" };
    }

    const result = await db.segmentMember.createMany({
      data: validIds.map((clientId) => ({
        segmentId: data.groupId,
        clientId,
        addedBy: userId,
      })),
      skipDuplicates: true,
    });

    const newCount = await db.segmentMember.count({
      where: { segmentId: data.groupId },
    });
    await db.segment.update({
      where: { id: data.groupId },
      data: { memberCount: newCount },
    });

    await audit(userId, "segment.members.add", data.groupId, {
      added: result.count,
      total: newCount,
    });

    revalidatePath("/segments");
    revalidatePath(`/segments/${data.groupId}`);
    return { success: true, data: { added: result.count } };
  } catch (error) {
    logger.error({ error }, "Failed to add members");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── RETIRER UN MEMBRE D'UN GROUPE ─────────────────────────────────────────────

export async function removeMemberFromGroup(input: unknown): Promise<Result> {
  try {
    await requireAuth();
    await checkPermission(PERMISSIONS.SEGMENTS_MANAGE_MEMBERS_ALL);

    const data = removeMemberSchema.parse(input);

    const group = await db.segment.findUnique({
      where: { id: data.groupId },
      select: { type: true },
    });
    if (!group) return { success: false, error: "Groupe introuvable" };
    if (group.type !== "STATIC") {
      return {
        success: false,
        error: "Les segments dynamiques se gèrent via les critères",
      };
    }

    await db.segmentMember.delete({
      where: {
        segmentId_clientId: {
          segmentId: data.groupId,
          clientId: data.clientId,
        },
      },
    });

    const newCount = await db.segmentMember.count({
      where: { segmentId: data.groupId },
    });
    await db.segment.update({
      where: { id: data.groupId },
      data: { memberCount: newCount },
    });

    revalidatePath(`/segments/${data.groupId}`);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to remove member");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── RAFRAÎCHIR UN SEGMENT DYNAMIQUE ──────────────────────────────────────────

export async function refreshSegment(
  segmentId: string
): Promise<Result<{ memberCount: number }>> {
  try {
    await requireAuth();
    await checkPermission(PERMISSIONS.SEGMENTS_UPDATE_ALL);

    const segment = await db.segment.findUnique({
      where: { id: segmentId },
      select: { type: true },
    });
    if (!segment) return { success: false, error: "Segment introuvable" };
    if (segment.type !== "DYNAMIC") {
      return {
        success: false,
        error: "Seuls les segments dynamiques peuvent être rafraîchis",
      };
    }

    const count = await refreshDynamicSegment(segmentId);

    revalidatePath("/segments");
    revalidatePath(`/segments/${segmentId}`);
    return { success: true, data: { memberCount: count } };
  } catch (error) {
    logger.error({ error }, "Failed to refresh segment");
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ── PRÉVISUALISER LES CRITÈRES ────────────────────────────────────────────────

export async function previewCriteria(
  criteria: CriteriaGroupDTO
): Promise<Result<SegmentPreviewResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await checkPermission(PERMISSIONS.SEGMENTS_CREATE_ALL);

    const rateCheck = await checkRateLimit({
      key: `preview_segment:${userId}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return { success: false, error: "Trop de requêtes." };
    }

    const result = await previewSegmentCriteria(criteria);
    return { success: true, data: result };
  } catch (error) {
    logger.error({ error }, "Failed to preview criteria");
    return { success: false, error: "Erreur lors de la prévisualisation" };
  }
}

// ── CHERCHER DES CLIENTS POUR L'AJOUT ────────────────────────────────────────

export async function searchClientsForGroup(
  groupId: string,
  search: string
): Promise<
  Result<
    Array<{
      id: string;
      firstName: string;
      lastName: string | null;
      phone: string | null;
      city: string | null;
    }>
  >
> {
  try {
    await requireAuth();
    await checkPermission(PERMISSIONS.SEGMENTS_MANAGE_MEMBERS_ALL);

    const clients = await getClientsNotInGroup(groupId, search || undefined, 20);
    return { success: true, data: clients };
  } catch (error) {
    logger.error({ error }, "Failed to search clients for group");
    return { success: false, error: "Erreur lors de la recherche" };
  }
}

// ── SUPPRIMER UN SEGMENT ──────────────────────────────────────────────────────

export async function deleteSegment(input: unknown): Promise<Result> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await checkPermission(PERMISSIONS.SEGMENTS_DELETE_ALL);

    const data = deleteSegmentSchema.parse(input);

    const segment = await db.segment.findUnique({
      where: { id: data.id },
      select: { name: true, type: true, memberCount: true, isSystem: true },
    });
    if (!segment) return { success: false, error: "Segment introuvable" };
    if (segment.isSystem) {
      return {
        success: false,
        error: "Les segments système ne peuvent pas être supprimés",
      };
    }

    await db.segment.delete({ where: { id: data.id } });

    await audit(userId, "segment.delete", data.id, {
      name: segment.name,
      type: segment.type,
      memberCount: segment.memberCount,
    });

    revalidatePath("/segments");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to delete segment");
    return { success: false, error: "Une erreur est survenue" };
  }
}
