// ── Période de temps ──────────────────────────────────────────────────────────

export type Period = "today" | "week" | "month" | "quarter" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export function resolvePeriod(period: Period): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        from: today,
        to: new Date(today.getTime() + 86_400_000 - 1),
      };
    case "week": {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return {
        from: new Date(new Date(today).setDate(diff)),
        to: now,
      };
    }
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1),
        to: now,
      };
    }
    case "year":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: now,
      };
    default:
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
  }
}

// ── KPIs principaux ───────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalRevenue: number;
  totalSales: number;
  averageBasket: number;
  paidRevenue: number;
  pendingRevenue: number;

  revenueGrowth: number;
  salesGrowth: number;

  totalClients: number;
  newClients: number;
  activeClients: number;
  clientGrowth: number;

  computedAt: Date;
  period: Period;
}

// ── Courbe CA ─────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  salesCount: number;
  label: string;
}

export interface RevenueChartData {
  points: RevenueDataPoint[];
  total: number;
  period: string;
  granularity: "day" | "week" | "month";
}

// ── Top clients ───────────────────────────────────────────────────────────────

export interface TopClient {
  clientId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  rfmScore: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt: Date | null;
}

// ── Top articles ──────────────────────────────────────────────────────────────

export interface TopArticle {
  articleId: string;
  articleName: string;
  articleRef: string;
  mainImage: string | null;
  quantitySold: number;
  revenue: number;
  salesCount: number;
}

// ── Répartition paiements ─────────────────────────────────────────────────────

export interface PaymentMethodStat {
  method: string;
  methodLabel: string;
  amount: number;
  count: number;
  percentage: number;
}

// ── Répartition géographique ──────────────────────────────────────────────────

export interface CityStat {
  city: string;
  clientCount: number;
  revenue: number;
  percentage: number;
}

// ── Stats RFM ─────────────────────────────────────────────────────────────────

export interface RFMDashboardStats {
  byProfile: Record<string, number>;
  total: number;
  scoredCount: number;
  unscoredCount: number;
  lastRunAt: Date | null;
}

// ── Stats segments ────────────────────────────────────────────────────────────

export interface SegmentStat {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  color: string;
  icon: string | null;
}

// ── Alertes dashboard ─────────────────────────────────────────────────────────

export interface DashboardAlert {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  action?: { label: string; href: string };
}

// ── Données complètes du dashboard ───────────────────────────────────────────

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueChart: RevenueChartData;
  topClients: TopClient[];
  topArticles: TopArticle[];
  paymentMethods: PaymentMethodStat[];
  cities: CityStat[];
  rfmStats: RFMDashboardStats;
  topSegments: SegmentStat[];
  alerts: DashboardAlert[];
  generatedAt: Date;
  fromCache: boolean;
  period: Period;
}

// ── Labels méthodes de paiement ──────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  FREE_MONEY: "Free Money",
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  CREDIT: "Crédit",
  CARD: "Carte bancaire",
  CHECK: "Chèque",
  OTHER: "Autre",
};
