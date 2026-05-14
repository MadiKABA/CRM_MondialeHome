"use server";

import { db } from "@/lib/db";
import type { RoleDTO, RoleListItemDTO } from "@/features/admin/types";

// ── Mapper Prisma → DTO ───────────────────────────────────────

function toRoleListItem(role: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  priority: number;
  _count: { permissions: number; users: number };
}): RoleListItemDTO {
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    priority: role.priority,
    permissionCount: role._count.permissions,
    userCount: role._count.users,
  };
}

// ── Liste des rôles ───────────────────────────────────────────

export async function getRoles(): Promise<RoleListItemDTO[]> {
  const roles = await db.role.findMany({
    orderBy: { priority: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isSystem: true,
      priority: true,
      _count: { select: { permissions: true, users: true } },
    },
  });

  return roles.map(toRoleListItem);
}

// ── Détail d'un rôle ──────────────────────────────────────────

export async function getRoleById(id: string): Promise<RoleDTO | null> {
  const role = await db.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isSystem: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { permissions: true, users: true } },
      permissions: {
        select: {
          permission: {
            select: {
              id: true,
              code: true,
              module: true,
              action: true,
              scope: true,
              description: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!role) return null;

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    priority: role.priority,
    permissionCount: role._count.permissions,
    userCount: role._count.users,
    permissions: role.permissions.map((rp) => rp.permission),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
