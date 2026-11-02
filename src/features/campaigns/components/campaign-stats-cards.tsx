import {
  Send,
  CheckCircle,
  Eye,
  MousePointerClick,
  MailX,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { pct } from "../lib/stats-math";
import type { CampaignDTO } from "../types";

interface Props {
  campaign: CampaignDTO;
}

export function CampaignStatsCards({ campaign: c }: Props) {
  const attempted = c.sentCount + c.failedCount;

  const cards = [
    {
      label: "Envoyés",
      value: c.sentCount,
      rate: pct(c.sentCount, attempted),
      Icon: Send,
      color: "text-gold-deep",
      bg: "bg-gold-light/30",
    },
    {
      label: "Délivrés",
      value: c.deliveredCount,
      rate: pct(c.deliveredCount, c.sentCount),
      Icon: CheckCircle,
      color: "text-text-primary",
      bg: "bg-cream",
    },
    {
      label: "Ouverts",
      value: c.openedCount,
      rate: pct(c.openedCount, c.deliveredCount),
      Icon: Eye,
      color: "text-gold-deep",
      bg: "bg-gold-light/30",
    },
    {
      label: "Cliqués",
      value: c.clickedCount,
      rate: pct(c.clickedCount, c.deliveredCount),
      Icon: MousePointerClick,
      color: "text-gold-darker",
      bg: "bg-gold-light/30",
    },
    {
      label: "Rebonds",
      value: c.bouncedCount,
      rate: pct(c.bouncedCount, c.sentCount),
      Icon: MailX,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Échecs",
      value: c.failedCount,
      rate: pct(c.failedCount, attempted),
      Icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ] as const;

  return (
    <div className="space-y-3">
      {c.trackingPending && (
        <div className="border-cream-darker bg-cream text-text-secondary flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
          <Clock className="text-gold-deep size-4 shrink-0" />
          Suivi en attente — aucun événement reçu (délivrance, ouverture, clic).
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => {
          const awaiting =
            c.trackingPending &&
            ["Délivrés", "Ouverts", "Cliqués", "Rebonds"].includes(card.label);
          return (
            <div
              key={card.label}
              className="border-cream-darker rounded-xl border bg-white p-4"
            >
              <div
                className={`mb-2 flex size-8 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.Icon className={`size-4 ${card.color}`} />
              </div>
              <p className="text-text-primary text-xl font-bold">
                {awaiting ? "—" : card.value}
              </p>
              <p className="text-text-muted text-xs">
                {card.label}
                {awaiting ? "" : ` · ${card.rate}%`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
