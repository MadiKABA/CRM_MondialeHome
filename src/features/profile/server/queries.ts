import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import type { ProfileDTO, SessionDTO } from "../types";

export async function getCurrentUserProfile(): Promise<ProfileDTO> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      phone: true,
      jobTitle: true,
      department: true,
      language: true,
      timezone: true,
      isActive: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      roles: {
        select: {
          role: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    phone: user.phone,
    jobTitle: user.jobTitle,
    department: user.department,
    language: user.language,
    timezone: user.timezone,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    roles: user.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
    })),
  };
}

export async function getCurrentUserSessions(): Promise<SessionDTO[]> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const sessions = await db.session.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
      token: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: s.token === session.session.token,
  }));
}
