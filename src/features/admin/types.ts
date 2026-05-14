// ============================================================
// DTOs — Module Administration
// Ne jamais exposer les types Prisma directement au client.
// ============================================================

import type { InvitationStatus } from "@prisma/client";

// ── Rôle ─────────────────────────────────────────────────────
export interface RoleDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  priority: number;
  permissionCount: number;
  userCount: number;
  permissions: PermissionDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleListItemDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  priority: number;
  permissionCount: number;
  userCount: number;
}

// ── Permission ────────────────────────────────────────────────
export interface PermissionDTO {
  id: string;
  code: string;
  module: string;
  action: string;
  scope: string;
  description: string | null;
  category: string | null;
}

// ── UserPermission (surcharge individuelle) ────────────────────
export interface UserPermissionDTO {
  id: string;
  permissionId: string;
  permissionCode: string;
  granted: boolean;
  reason: string | null;
  expiresAt: Date | null;
  grantedBy: string | null;
  grantedByName: string | null;
  createdAt: Date;
}

// ── Utilisateur ───────────────────────────────────────────────
export interface UserDTO {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  language: string;
  timezone: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: Date | null;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetailDTO extends UserDTO {
  roles: RoleListItemDTO[];
  permissions: UserPermissionDTO[];
  sessionCount: number;
}

export interface UserListItemDTO {
  id: string;
  name: string;
  email: string;
  image: string | null;
  jobTitle: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: Date | null;
  roles: { id: string; name: string; slug: string }[];
  createdAt: Date;
}

// ── Invitation ────────────────────────────────────────────────
export interface InvitationDTO {
  id: string;
  email: string;
  status: InvitationStatus;
  invitedBy: { id: string; name: string };
  role: { id: string; name: string } | null;
  expiresAt: Date;
  createdAt: Date;
}

// ── Session ───────────────────────────────────────────────────
export interface SessionDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

// ── Audit ─────────────────────────────────────────────────────
export interface AuditLogDTO {
  id: string;
  userId: string | null;
  userName: string | null;
  userImage: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Résultat générique des Server Actions ─────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Stats admin dashboard ─────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  recentlyActive: number;
  totalRoles: number;
  activeSessions: number;
}
