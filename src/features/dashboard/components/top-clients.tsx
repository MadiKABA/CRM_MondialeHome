import Link from "next/link";
import { ExternalLink, Trophy } from "lucide-react";
import { RFM_PROFILE_CONFIGS } from "@/features/rfm/types";
import type { RFMProfile } from "@/features/rfm/types";
import { cn } from "@/lib/utils";
import type { TopClient } from "../types";

interface Props {
  clients: TopClient[];
}

function formatFCFA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k`;
  return amount.toLocaleString("fr-FR");
}

export function TopClientsCard({ clients }: Props) {
  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-gold-deep size-4" />
          <h3 className="text-text-primary text-sm font-semibold">Top clients</h3>
        </div>
        <Link
          href="/clients?sort=totalSpent"
          className="text-gold-deep hover:text-gold-darker text-xs transition-colors"
        >
          Voir tous →
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-text-muted py-6 text-center text-sm">
          Aucune vente sur cette période
        </p>
      ) : (
        <div>
          {clients.map((client, index) => {
            const rfmConfig =
              client.rfmScore &&
              Object.prototype.hasOwnProperty.call(RFM_PROFILE_CONFIGS, client.rfmScore)
                ? RFM_PROFILE_CONFIGS[client.rfmScore as RFMProfile]
                : null;

            return (
              <Link
                key={client.clientId}
                href={`/clients/${client.clientId}`}
                className="border-cream-darker hover:bg-cream/30 group -mx-2 flex items-center gap-3 rounded-lg border-b px-2 py-2.5 transition-colors last:border-0"
              >
                <span
                  className={cn(
                    "w-5 shrink-0 text-center text-sm font-bold",
                    index === 0
                      ? "text-gold-deep"
                      : index === 1
                        ? "text-gray-500"
                        : index === 2
                          ? "text-amber-600"
                          : "text-text-muted"
                  )}
                >
                  {index + 1}
                </span>

                <div className="bg-gold-light/40 flex size-8 shrink-0 items-center justify-center rounded-full">
                  <span className="text-gold-darker text-xs font-bold">
                    {client.firstName[0]}
                    {client.lastName?.[0] ?? ""}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate text-sm font-medium">
                    {client.firstName} {client.lastName ?? ""}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {client.city && (
                      <span className="text-text-muted text-[10px]">{client.city}</span>
                    )}
                    {rfmConfig && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          rfmConfig.color,
                          rfmConfig.textColor
                        )}
                      >
                        {rfmConfig.icon} {rfmConfig.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-text-primary text-sm font-bold">
                    {formatFCFA(client.totalSpent)} FCFA
                  </p>
                  <p className="text-text-muted text-[10px]">
                    {client.totalOrders} commande(s)
                  </p>
                </div>

                <ExternalLink className="text-text-muted size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
