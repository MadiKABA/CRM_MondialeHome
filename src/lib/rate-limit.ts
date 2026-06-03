import "server-only";

import { redis } from "@/lib/redis";

interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redisKey = `rl:${config.key}`;
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.pexpire(redisKey, config.windowMs);
    }
    return {
      allowed: current <= config.limit,
      remaining: Math.max(0, config.limit - current),
    };
  } catch {
    // Redis indisponible → ne pas bloquer l'utilisateur
    return { allowed: true, remaining: 0 };
  }
}

export const RATE_LIMITS = {
  // Ventes
  CREATE_SALE: { limit: 30, windowMs: 60_000 },
  UPDATE_SALE: { limit: 20, windowMs: 60_000 },
  CANCEL_SALE: { limit: 10, windowMs: 60_000 },
  ADD_PAYMENT: { limit: 20, windowMs: 60_000 },
  IMPORT_SALES: { limit: 3, windowMs: 300_000 },
  EXPORT_SALES: { limit: 5, windowMs: 60_000 },

  // Articles
  CREATE_ARTICLE: { limit: 30, windowMs: 60_000 },
  UPDATE_ARTICLE: { limit: 30, windowMs: 60_000 },
  DELETE_ARTICLE: { limit: 10, windowMs: 60_000 },
  IMPORT_ARTICLES: { limit: 3, windowMs: 300_000 },
  EXPORT_ARTICLES: { limit: 5, windowMs: 60_000 },

  // Clients
  CREATE_CLIENT: { limit: 50, windowMs: 60_000 },
  UPDATE_CLIENT: { limit: 50, windowMs: 60_000 },
  DELETE_CLIENT: { limit: 10, windowMs: 60_000 },
  IMPORT_CLIENTS: { limit: 3, windowMs: 300_000 },
  EXPORT_CLIENTS: { limit: 5, windowMs: 60_000 },

  // Admin
  CREATE_USER: { limit: 20, windowMs: 60_000 },
  UPDATE_PERMS: { limit: 10, windowMs: 60_000 },
  LOGIN_ATTEMPT: { limit: 5, windowMs: 900_000 },
} as const;
