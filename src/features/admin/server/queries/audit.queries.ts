"use server";

import { db } from "@/lib/db";
import type { AuditLogDTO, PaginatedResult } from "@/features/admin/types";

interface AuditFilters {
  search?: string;
  userId?: string;
  entity?: string;
  action?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

function toAuditLogDTO(log: {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  user: { name: string; image: string | null } | null;
}): AuditLogDTO {
  return {
    id: log.id,
    userId: log.userId,
    userName: log.user?.name ?? null,
    userImage: log.user?.image ?? null,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    oldValue: log.oldValue as Record<string, unknown> | null,
    newValue: log.newValue as Record<string, unknown> | null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    status: log.status,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt,
  };
}

export async function getAuditLogs(
  filters: AuditFilters = {}
): Promise<PaginatedResult<AuditLogDTO>> {
  const { search, userId, entity, action, status, page = 1, pageSize = 30 } = filters;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(userId && { userId }),
    ...(entity && { entity }),
    ...(action && { action: { contains: action, mode: "insensitive" as const } }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { action: { contains: search, mode: "insensitive" as const } },
        { entity: { contains: search, mode: "insensitive" as const } },
        { user: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        userAgent: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        user: { select: { name: true, image: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    data: logs.map(toAuditLogDTO),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAuditEntities(): Promise<string[]> {
  const results = await db.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });
  return results.map((r) => r.entity);
}
