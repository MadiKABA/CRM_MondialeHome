"use server";

import { logger } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { getFullDashboardData, getDashboardKPIs } from "./queries";
import {
  invalidateDashboardCache,
  invalidateSaleRelatedCache,
  getCacheMetrics,
} from "../lib/cache";
import type { Period } from "../types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Charger le dashboard complet ──────────────────────────────────────────────

export async function loadDashboard(
  period: Period = "month"
): Promise<Result<Awaited<ReturnType<typeof getFullDashboardData>>>> {
  try {
    const canView = await hasPermission(PERMISSIONS.ANALYTICS_VIEW_BASIC);
    if (!canView) return { success: false, error: "Permission insuffisante" };

    const rl = await checkRateLimit({
      key: `dashboard:load`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return { success: false, error: "Trop de requêtes." };
    }

    const data = await getFullDashboardData(period);
    return { success: true, data };
  } catch (error) {
    logger.error({ error }, "loadDashboard failed");
    return { success: false, error: "Erreur lors du chargement du dashboard" };
  }
}

// ── Rafraîchir uniquement les KPIs ───────────────────────────────────────────

export async function refreshKPIs(
  period: Period = "month"
): Promise<Result<Awaited<ReturnType<typeof getDashboardKPIs>>>> {
  try {
    const canView = await hasPermission(PERMISSIONS.ANALYTICS_VIEW_BASIC);
    if (!canView) return { success: false, error: "Permission insuffisante" };

    const rl = await checkRateLimit({
      key: `dashboard:kpis`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return { success: false, error: "Trop de requêtes." };

    const data = await getDashboardKPIs(period);
    return { success: true, data };
  } catch (error) {
    logger.error({ error }, "refreshKPIs failed");
    return { success: false, error: "Erreur de chargement" };
  }
}

// ── Forcer le rafraîchissement du cache (admins uniquement) ──────────────────

export async function forceRefreshDashboard(
  period: Period = "month"
): Promise<Result<Awaited<ReturnType<typeof getFullDashboardData>>>> {
  try {
    const canView = await hasPermission(PERMISSIONS.ANALYTICS_VIEW_ADVANCED);
    if (!canView) return { success: false, error: "Permission insuffisante" };

    const rl = await checkRateLimit({
      key: `dashboard:force_refresh`,
      limit: 3,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return {
        success: false,
        error: "Trop de rafraîchissements. Attendez une minute.",
      };
    }

    await invalidateDashboardCache();
    const data = await getFullDashboardData(period);

    logger.info({ period }, "Dashboard cache force-refreshed");
    return { success: true, data };
  } catch (error) {
    logger.error({ error }, "forceRefreshDashboard failed");
    return { success: false, error: "Erreur lors du rafraîchissement" };
  }
}

// ── Métriques du cache (monitoring admin) ────────────────────────────────────

export async function getDashboardCacheMetrics(): Promise<
  Result<{
    keys: number;
    memory: string;
    hitRate: string;
  }>
> {
  try {
    const canView = await hasPermission(PERMISSIONS.ADMIN_SETTINGS_READ_ALL);
    if (!canView) return { success: false, error: "Permission insuffisante" };

    const metrics = await getCacheMetrics();
    return { success: true, data: metrics };
  } catch (error) {
    logger.error({ error }, "getDashboardCacheMetrics failed");
    return { success: false, error: "Erreur" };
  }
}

// ── Invalider le cache après mutation de vente ───────────────────────────────
// Appelé depuis createSale, cancelSale, importSales — pas de vérif auth car
// c'est une action interne déclenchée après une action déjà sécurisée.

export async function invalidateDashboardAfterSale(
  period: string = "month"
): Promise<void> {
  try {
    await invalidateSaleRelatedCache(period);
  } catch (error) {
    logger.warn({ error }, "Dashboard cache invalidation after sale failed");
  }
}
