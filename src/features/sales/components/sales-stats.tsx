import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import type { SaleStats } from "../types";

interface SalesStatsProps {
  stats: SaleStats;
}

export function SalesStats({ stats }: SalesStatsProps) {
  const cards = [
    {
      label: "CA total",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Ventes",
      value: stats.totalSales.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      label: "Panier moyen",
      value: formatCurrency(stats.averageBasket),
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      label: "Impayées",
      value: (stats.unpaidCount + stats.partialCount).toString(),
      icon: AlertCircle,
      color:
        stats.unpaidCount + stats.partialCount > 0
          ? "text-red-600"
          : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="border-border bg-card space-y-2 rounded-xl border p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {card.label}
            </span>
            <card.icon className={`size-4 ${card.color}`} />
          </div>
          <p className="font-heading text-xl font-semibold tabular-nums">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
