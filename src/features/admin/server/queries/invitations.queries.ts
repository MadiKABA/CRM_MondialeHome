"use server";

import { db } from "@/lib/db";
import type { InvitationDTO, PaginatedResult } from "@/features/admin/types";

function toInvitationDTO(inv: {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { id: string; name: string };
  role: { id: string; name: string } | null;
}): InvitationDTO {
  return {
    id: inv.id,
    email: inv.email,
    status: inv.status,
    invitedBy: inv.invitedBy,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  };
}

export async function getInvitations(
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<InvitationDTO>> {
  const skip = (page - 1) * pageSize;

  const [invitations, total] = await Promise.all([
    db.invitation.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    }),
    db.invitation.count(),
  ]);

  return {
    data: invitations.map(toInvitationDTO),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
