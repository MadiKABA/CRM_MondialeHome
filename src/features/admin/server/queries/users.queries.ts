"use server";

import { db } from "@/lib/db";
import type {
  UserListItemDTO,
  UserDetailDTO,
  AdminStats,
  PaginatedResult,
} from "@/features/admin/types";

// ── Filtres liste utilisateurs ────────────────────────────────

interface UsersFilters {
  search?: string;
  roleSlug?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

// ── Mapper Prisma → DTO ───────────────────────────────────────

function toUserListItem(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  jobTitle: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { role: { id: string; name: string; slug: string } }[];
}): UserListItemDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    jobTitle: user.jobTitle,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
    lastLoginAt: user.lastLoginAt,
    roles: user.roles.map((r) => r.role),
    createdAt: user.createdAt,
  };
}

// ── Queries ───────────────────────────────────────────────────

export async function getUsers(
  filters: UsersFilters = {}
): Promise<PaginatedResult<UserListItemDTO>> {
  const { search, roleSlug, isActive, page = 1, pageSize = 20 } = filters;

  const where = {
    deletedAt: null,
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(roleSlug && {
      roles: { some: { role: { slug: roleSlug } } },
    }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        jobTitle: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        roles: {
          select: { role: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);

  return {
    data: users.map(toUserListItem),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserById(id: string): Promise<UserDetailDTO | null> {
  const user = await db.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      phone: true,
      image: true,
      jobTitle: true,
      department: true,
      language: true,
      timezone: true,
      isActive: true,
      isSuperAdmin: true,
      lastLoginAt: true,
      loginCount: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              isSystem: true,
              priority: true,
              _count: { select: { permissions: true, users: true } },
            },
          },
        },
      },
      permissions: {
        select: {
          id: true,
          permissionId: true,
          granted: true,
          reason: true,
          expiresAt: true,
          grantedBy: true,
          createdAt: true,
          permission: { select: { code: true } },
        },
      },
      _count: { select: { sessions: true } },
    },
  });

  if (!user) return null;

  // Récupérer les noms des grantedBy
  const grantedByIds = user.permissions
    .filter((p) => p.grantedBy !== null)
    .map((p) => p.grantedBy as string);

  const granters =
    grantedByIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: grantedByIds } },
          select: { id: true, name: true },
        })
      : [];

  const granterMap = new Map(granters.map((g) => [g.id, g.name]));

  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    image: user.image,
    jobTitle: user.jobTitle,
    department: user.department,
    language: user.language,
    timezone: user.timezone,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
    lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map((r) => ({
      id: r.role.id,
      name: r.role.name,
      slug: r.role.slug,
      description: r.role.description,
      isSystem: r.role.isSystem,
      priority: r.role.priority,
      permissionCount: r.role._count.permissions,
      userCount: r.role._count.users,
    })),
    permissions: user.permissions.map((p) => ({
      id: p.id,
      permissionId: p.permissionId,
      permissionCode: p.permission.code,
      granted: p.granted,
      reason: p.reason,
      expiresAt: p.expiresAt,
      grantedBy: p.grantedBy,
      grantedByName: p.grantedBy ? (granterMap.get(p.grantedBy) ?? null) : null,
      createdAt: p.createdAt,
    })),
    sessionCount: user._count.sessions,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    activeUsers,
    pendingInvitations,
    recentlyActive,
    totalRoles,
    activeSessions,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, isActive: true } }),
    db.invitation.count({ where: { status: "PENDING", expiresAt: { gt: new Date() } } }),
    db.user.count({
      where: { deletedAt: null, isActive: true, lastLoginAt: { gte: sevenDaysAgo } },
    }),
    db.role.count(),
    db.session.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingInvitations,
    recentlyActive,
    totalRoles,
    activeSessions,
  };
}
