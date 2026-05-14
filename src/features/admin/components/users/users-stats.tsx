import { Users, Mail, Wifi, Clock } from "lucide-react";
import type { AdminStats } from "@/features/admin/types";

interface UsersStatsProps {
  stats: AdminStats;
}

const STAT_CARDS = [
  {
    key: "activeUsers" as const,
    label: "Membres actifs",
    icon: Users,
    description: "Comptes avec accès",
  },
  {
    key: "pendingInvitations" as const,
    label: "Invitations en attente",
    icon: Mail,
    description: "Invitations non acceptées",
  },
  {
    key: "recentlyActive" as const,
    label: "Connectés récemment",
    icon: Wifi,
    description: "Dans les 7 derniers jours",
  },
  {
    key: "activeSessions" as const,
    label: "Sessions ouvertes",
    icon: Clock,
    description: "Connexions actives en ce moment",
  },
];

export function UsersStats({ stats }: UsersStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="border-cream-darker bg-cream/30 rounded-xl border p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                {card.label}
              </p>
              <p className="text-text-primary mt-2 text-3xl font-bold">
                {stats[card.key]}
              </p>
              <p className="text-text-secondary mt-1 text-xs">{card.description}</p>
            </div>
            <div className="bg-gold-light/40 rounded-lg p-2.5">
              <card.icon className="text-gold-deep size-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
