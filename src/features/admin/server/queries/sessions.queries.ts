"use server";

import { db } from "@/lib/db";
import type { SessionDTO } from "@/features/admin/types";

export async function getUserSessions(userId: string): Promise<SessionDTO[]> {
  const sessions = await db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      expiresAt: true,
      createdAt: true,
      user: { select: { name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
    userImage: s.user.image,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  }));
}

export async function getAllActiveSessions(
  page = 1,
  pageSize = 30
): Promise<{ data: SessionDTO[]; total: number }> {
  const where = { expiresAt: { gt: new Date() } };

  const [sessions, total] = await Promise.all([
    db.session.findMany({
      where,
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.session.count({ where }),
  ]);

  return {
    data: sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name,
      userEmail: s.user.email,
      userImage: s.user.image,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
    total,
  };
}
