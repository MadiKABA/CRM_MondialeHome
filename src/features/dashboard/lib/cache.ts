import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

// ── Clés de cache ─────────────────────────────────────────────────────────────

export const CACHE_KEYS = {
  kpis: (period: string) => `dashboard:kpis:${period}`,
  revenueChart: (period: string) => `dashboard:revenue:${period}`,
  topClients: (period: string) => `dashboard:top_clients:${period}`,
  topArticles: (period: string) => `dashboard:top_articles:${period}`,
  paymentMethods: (period: string) => `dashboard:payments:${period}`,
  cities: () => `dashboard:cities`,
  rfmStats: () => `dashboard:rfm`,
  segments: () => `dashboard:segments`,
  all: () => `dashboard:*`,
} as const;

// ── TTL en secondes ───────────────────────────────────────────────────────────

export const CACHE_TTL = {
  kpis: 2 * 60,
  revenueChart: 10 * 60,
  topClients: 5 * 60,
  topArticles: 5 * 60,
  paymentMethods: 5 * 60,
  cities: 30 * 60,
  rfmStats: 30 * 60,
  segments: 10 * 60,
} as const;

// ── Getter générique avec fallback ────────────────────────────────────────────
// Pattern Cache-Aside + Stale-While-Revalidate :
// - cache chaud → retour immédiat
// - cache > 80% du TTL → retour + revalidation en arrière-plan
// - pas de cache → calcul + mise en cache
// - Redis down → fallback DB direct

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redis = getRedisClient();

  if (!redis) {
    return fetcher();
  }

  try {
    const cached = await redis.get(key);

    if (cached) {
      const parsed = JSON.parse(cached) as {
        data: T;
        cachedAt: number;
        ttl: number;
      };

      const age = Date.now() - parsed.cachedAt;
      const isStale = age > parsed.ttl * 0.8 * 1000;

      if (isStale) {
        revalidateInBackground(key, fetcher, ttlSeconds).catch((err) => {
          logger.warn({ err, key }, "Background revalidation failed");
        });
      }

      return parsed.data;
    }

    const data = await fetcher();
    await setCached(key, data, ttlSeconds);
    return data;
  } catch (error) {
    logger.warn({ error, key }, "Cache read failed — falling back to DB");
    return fetcher();
  }
}

// ── Setter ────────────────────────────────────────────────────────────────────

export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const payload = JSON.stringify({
      data,
      cachedAt: Date.now(),
      ttl: ttlSeconds,
    });

    await redis.setex(key, ttlSeconds, payload);
  } catch (error) {
    logger.warn({ error, key }, "Cache write failed — continuing without cache");
  }
}

// ── Invalider une clé ─────────────────────────────────────────────────────────

export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    logger.warn({ error, key }, "Cache invalidation failed");
  }
}

// ── Invalider plusieurs clés par pattern (SCAN — pas KEYS) ───────────────────

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.info({ pattern, count: keysToDelete.length }, "Cache invalidated");
    }
  } catch (error) {
    logger.warn({ error, pattern }, "Cache pattern invalidation failed");
  }
}

// ── Invalider tout le dashboard ───────────────────────────────────────────────

export async function invalidateDashboardCache(): Promise<void> {
  await invalidateCachePattern("dashboard:*");
}

// ── Invalider après une vente ─────────────────────────────────────────────────
// Granulaire — ne vide pas tout le cache, seulement les clés affectées

export async function invalidateSaleRelatedCache(
  period: string = "month"
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const keysToInvalidate = [
    CACHE_KEYS.kpis(period),
    CACHE_KEYS.topClients(period),
    CACHE_KEYS.topArticles(period),
    CACHE_KEYS.paymentMethods(period),
    CACHE_KEYS.revenueChart(period),
    CACHE_KEYS.kpis("year"),
    CACHE_KEYS.kpis("quarter"),
    CACHE_KEYS.revenueChart("year"),
  ];

  try {
    await redis.del(...keysToInvalidate);
  } catch (error) {
    logger.warn({ error }, "Sale cache invalidation failed");
  }
}

// ── Obtenir les métriques du cache ────────────────────────────────────────────

export async function getCacheMetrics(): Promise<{
  keys: number;
  memory: string;
  hitRate: string;
}> {
  const redis = getRedisClient();
  if (!redis) return { keys: 0, memory: "N/A", hitRate: "N/A" };

  try {
    const [info, memory, dbSize] = await Promise.all([
      redis.info("stats"),
      redis.info("memory"),
      redis.dbsize(),
    ]);

    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    const memMatch = memory.match(/used_memory_human:(\S+)/);

    const hits = parseInt(hitsMatch?.[1] ?? "0");
    const misses = parseInt(missesMatch?.[1] ?? "0");
    const total = hits + misses;

    return {
      keys: dbSize,
      memory: memMatch?.[1] ?? "N/A",
      hitRate: total > 0 ? `${Math.round((hits / total) * 100)}%` : "N/A",
    };
  } catch {
    return { keys: 0, memory: "N/A", hitRate: "N/A" };
  }
}

// ── Revalidation en arrière-plan ──────────────────────────────────────────────

async function revalidateInBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<void> {
  try {
    const data = await fetcher();
    await setCached(key, data, ttlSeconds);
    logger.info({ key }, "Background cache revalidated");
  } catch (error) {
    logger.warn({ error, key }, "Background revalidation failed");
  }
}
