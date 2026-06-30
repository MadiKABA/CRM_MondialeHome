import { Send, CheckCircle, Eye, MousePointerClick, AlertTriangle } from "lucide-react";
import type { CampaignDTO } from "../types";

interface Props {
  campaign: CampaignDTO;
}

export function CampaignStatsCards({ campaign: c }: Props) {
  const cards = [
    {
      label: "Envoyés",
      value: c.sentCount,
      Icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Délivrés",
      value: c.deliveredCount,
      rate: `${c.deliveryRate}%`,
      Icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Ouverts",
      value: c.openedCount,
      rate: `${c.openRate}%`,
      Icon: Eye,
      color: "text-gold-deep",
      bg: "bg-gold-light/30",
    },
    {
      label: "Cliqués",
      value: c.clickedCount,
      rate: `${c.clickRate}%`,
      Icon: MousePointerClick,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Échoués",
      value: c.failedCount,
      rate: `${c.bounceRate}%`,
      Icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="border-cream-darker rounded-xl border bg-white p-4"
        >
          <div
            className={`mb-2 flex size-8 items-center justify-center rounded-lg ${card.bg}`}
          >
            <card.Icon className={`size-4 ${card.color}`} />
          </div>
          <p className="text-text-primary text-xl font-bold">{card.value}</p>
          <p className="text-text-muted text-xs">
            {card.label}
            {"rate" in card && card.rate ? ` · ${card.rate}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
