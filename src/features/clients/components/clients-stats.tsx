import { Users, UserCheck, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ClientsStatsProps {
  total: number;
  active: number;
  vip: number;
  newThisMonth: number;
}

export function ClientsStats({ total, active, vip, newThisMonth }: ClientsStatsProps) {
  const stats = [
    {
      label: "Total clients",
      value: total.toLocaleString("fr-FR"),
      icon: Users,
      iconClass: "text-text-secondary",
    },
    {
      label: "Actifs",
      value: active.toLocaleString("fr-FR"),
      icon: UserCheck,
      iconClass: "text-gold-deep",
    },
    {
      label: "VIP",
      value: vip.toLocaleString("fr-FR"),
      icon: Star,
      iconClass: "text-gold-deep",
    },
    {
      label: "Nouveaux ce mois",
      value: `+${newThisMonth.toLocaleString("fr-FR")}`,
      icon: TrendingUp,
      iconClass: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, iconClass }) => (
        <Card key={label} className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-cream rounded-lg p-2">
              <Icon className={`size-5 ${iconClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-text-secondary text-xs">{label}</p>
              <p className="font-heading text-lg leading-tight font-bold">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
