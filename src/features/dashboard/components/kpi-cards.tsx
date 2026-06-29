import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKPIs } from "../types";

interface Props {
  kpis: DashboardKPIs;
}

function formatFCFA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M FCFA`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k FCFA`;
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function GrowthBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-green-600" : isNeutral ? "text-text-muted" : "text-red-500"
      )}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : isNeutral ? (
        <Minus className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {value}% vs période préc.
      </span>
    </div>
  );
}

export function KPICards({ kpis }: Props) {
  const cards = [
    {
      label: "Chiffre d'affaires",
      value: formatFCFA(kpis.totalRevenue),
      subValue: `${formatFCFA(kpis.paidRevenue)} encaissé`,
      growth: kpis.revenueGrowth,
      icon: CreditCard,
      color: "text-gold-deep",
      bg: "bg-gold-light/30",
    },
    {
      label: "Ventes",
      value: kpis.totalSales.toLocaleString("fr-FR"),
      subValue: `Panier moy. ${formatFCFA(kpis.averageBasket)}`,
      growth: kpis.salesGrowth,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Clients actifs",
      value: kpis.activeClients.toLocaleString("fr-FR"),
      subValue: `sur ${kpis.totalClients.toLocaleString("fr-FR")} total`,
      growth: kpis.clientGrowth,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Nouveaux clients",
      value: kpis.newClients.toLocaleString("fr-FR"),
      subValue:
        kpis.pendingRevenue > 0
          ? `${formatFCFA(kpis.pendingRevenue)} en attente`
          : "Aucun impayé",
      growth: kpis.clientGrowth,
      icon: BarChart2,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="border-cream-darker rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-text-muted text-xs font-medium">{card.label}</p>
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                card.bg
              )}
            >
              <card.icon className={cn("size-4", card.color)} />
            </div>
          </div>

          <p className="text-text-primary mb-1 text-2xl font-bold">{card.value}</p>
          <p className="text-text-muted mb-2 text-xs">{card.subValue}</p>
          <GrowthBadge value={card.growth} />
        </div>
      ))}
    </div>
  );
}
