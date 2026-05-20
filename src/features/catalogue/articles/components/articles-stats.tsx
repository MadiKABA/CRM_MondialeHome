import { Package, CheckCircle, XCircle, Tag, Sparkles } from "lucide-react";
import type { ArticleStats } from "../types";

interface ArticlesStatsProps {
  stats: ArticleStats;
}

export function ArticlesStats({ stats }: ArticlesStatsProps) {
  const items = [
    { label: "Total", value: stats.total, icon: Package, color: "text-foreground" },
    {
      label: "Disponibles",
      value: stats.available,
      icon: CheckCircle,
      color: "text-gold-deep",
    },
    { label: "Ruptures", value: stats.outOfStock, icon: XCircle, color: "text-red-600" },
    { label: "En promo", value: stats.inPromo, icon: Tag, color: "text-emerald-600" },
    {
      label: "Nouveautés",
      value: stats.newArrivals,
      icon: Sparkles,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="border-cream-darker bg-card flex items-center gap-3 rounded-xl border p-4"
        >
          <div className="bg-gold-light/20 flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className={`size-4 ${color}`} />
          </div>
          <div>
            <p className="text-xl leading-none font-bold">{value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
