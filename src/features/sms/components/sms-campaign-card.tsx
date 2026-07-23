"use client";

import { Users, MessageSquare, Coins, Calendar } from "lucide-react";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import type { SmsCampaignDTO } from "../types";

interface Props {
  campaign: SmsCampaignDTO;
  onView: () => void;
}

export function SmsCampaignCard({ campaign: c, onView }: Props) {
  return (
    <div
      onClick={onView}
      className="border-cream-darker hover:border-gold/30 cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-text-primary text-sm font-semibold">{c.name}</h3>
            <CampaignStatusBadge status={c.status} size="sm" />
          </div>

          <div className="text-text-muted flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {c.segmentName} ({c.segmentCount} clients)
            </span>
            {c.scheduledAt && c.status === "SCHEDULED" && (
              <span className="flex items-center gap-1 text-blue-600">
                <Calendar className="size-3.5" />
                {new Date(c.scheduledAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {["SENT", "SENDING", "COMPLETED"].includes(c.status) && (
          <div className="flex shrink-0 items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-text-primary font-bold">{c.totalSent}</p>
              <p className="text-text-muted">Envoyés</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary flex items-center gap-1 font-bold">
                <MessageSquare className="size-3" />
                {c.deliveryRate}%
              </p>
              <p className="text-text-muted">Délivrés</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary flex items-center gap-1 font-bold">
                <Coins className="size-3" />
                {c.costActual.toLocaleString("fr-FR")}
              </p>
              <p className="text-text-muted">FCFA</p>
            </div>
          </div>
        )}
      </div>

      {c.status === "SENDING" && c.totalRecipients > 0 && (
        <div className="mt-3">
          <div className="bg-cream-darker h-1.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.round((c.totalSent / c.totalRecipients) * 100)}%` }}
            />
          </div>
          <p className="text-text-muted mt-1 text-[10px]">
            {c.totalSent} / {c.totalRecipients} envoyés
          </p>
        </div>
      )}
    </div>
  );
}
