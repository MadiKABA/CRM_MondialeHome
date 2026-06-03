import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function auditSale(
  userId: string,
  action: string,
  entityId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const h = await headers();
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity: "Sale",
        entityId: entityId ?? null,
        newValue: (meta ?? null) as never,
        ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
        userAgent: h.get("user-agent") ?? null,
        status: "success",
      },
    });
  } catch (err) {
    // Ne jamais faire échouer l'action principale si l'audit plante
    console.error("[audit] Failed to write audit log:", err);
  }
}
