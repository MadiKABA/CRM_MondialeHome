"use client";

import { PeriodSelector } from "./period-selector";
import { KPICards } from "./kpi-cards";
import { RevenueChart } from "./revenue-chart";
import { PaymentMethodsChart } from "./payment-methods-chart";
import { CitiesChart } from "./cities-chart";
import { TopClientsCard } from "./top-clients";
import { TopArticlesCard } from "./top-articles";
import { RFMStatsCard } from "./rfm-stats";
import { SegmentsOverview } from "./segments-overview";
import { AlertsBanner } from "./alerts-banner";
import { RefreshButton } from "./refresh-button";
import type {
  Period,
  DashboardKPIs,
  RevenueChartData,
  TopClient,
  TopArticle,
  PaymentMethodStat,
  CityStat,
  RFMDashboardStats,
  SegmentStat,
  DashboardAlert,
} from "../types";

interface DashboardData {
  kpis: DashboardKPIs;
  revenueChart: RevenueChartData;
  topClients: TopClient[];
  topArticles: TopArticle[];
  paymentMethods: PaymentMethodStat[];
  cities: CityStat[];
  rfmStats: RFMDashboardStats;
  topSegments: SegmentStat[];
  alerts: DashboardAlert[];
}

interface Props {
  data: DashboardData;
  period: Period;
  userName: string;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0] ?? name;
  if (hour < 12) return `Bonjour ${firstName} ☀️`;
  if (hour < 18) return `Bon après-midi ${firstName} 🌤️`;
  return `Bonsoir ${firstName} 🌙`;
}

export function DashboardShell({ data, period, userName }: Props) {
  return (
    <div className="space-y-6 p-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-text-primary font-serif text-2xl font-bold">
            {getGreeting(userName)}
          </h1>
          <p className="text-text-secondary mt-0.5 text-sm">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector current={period} />
          <RefreshButton period={period} />
        </div>
      </div>

      {/* ── Alertes ─────────────────────────────────────────────────────────── */}
      {data.alerts.length > 0 && <AlertsBanner alerts={data.alerts} />}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <KPICards kpis={data.kpis} />

      {/* ── Courbe CA + Paiements ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenueChart} />
        </div>
        <div>
          <PaymentMethodsChart data={data.paymentMethods} />
        </div>
      </div>

      {/* ── Top clients + Top articles ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopClientsCard clients={data.topClients} />
        <TopArticlesCard articles={data.topArticles} />
      </div>

      {/* ── RFM + Segments + Villes ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RFMStatsCard stats={data.rfmStats} />
        <SegmentsOverview segments={data.topSegments} />
        <CitiesChart data={data.cities} />
      </div>
    </div>
  );
}
