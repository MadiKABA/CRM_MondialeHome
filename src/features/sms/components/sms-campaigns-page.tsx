"use client";

import { useRouter } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmsCampaignCard } from "./sms-campaign-card";
import { SmsCampaignsFilters } from "./sms-campaigns-filters";
import { SmsBalanceIndicator } from "./sms-balance-indicator";
import type { PaginatedSmsCampaigns } from "../types";

interface Props {
  initialData: PaginatedSmsCampaigns;
  permissions: { canCreate: boolean };
}

export function SmsCampaignsPage({ initialData, permissions }: Props) {
  const router = useRouter();
  const { campaigns, stats } = initialData;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-text-primary font-serif text-2xl font-bold">
            Campagnes SMS
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Créez et suivez vos campagnes SMS Mtarget
          </p>
        </div>
        {permissions.canCreate && (
          <Link href="/sms/nouvelle">
            <Button className="bg-gold-deep hover:bg-gold-darker gap-2 text-white">
              <Plus className="size-4" />
              Nouvelle campagne SMS
            </Button>
          </Link>
        )}
      </div>

      <SmsBalanceIndicator />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: "📊" },
          { label: "Envoyées", value: stats.byStatus.SENT ?? 0, icon: "✅" },
          { label: "En cours", value: stats.byStatus.SENDING ?? 0, icon: "📤" },
          { label: "Planifiées", value: stats.byStatus.SCHEDULED ?? 0, icon: "🕐" },
        ].map((s) => (
          <div
            key={s.label}
            className="border-cream-darker flex items-center gap-3 rounded-xl border bg-white p-4"
          >
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-text-primary text-xl font-bold">{s.value}</p>
              <p className="text-text-muted text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <SmsCampaignsFilters />

      {campaigns.length === 0 ? (
        <div className="border-cream-darker rounded-xl border-2 border-dashed p-16 text-center">
          <MessageSquare className="text-text-muted mx-auto mb-4 size-10" />
          <p className="text-text-secondary mb-1 text-base font-medium">
            Aucune campagne SMS
          </p>
          <p className="text-text-muted mb-4 text-sm">
            Créez votre première campagne d&apos;envoi SMS
          </p>
          {permissions.canCreate && (
            <Link href="/sms/nouvelle">
              <Button className="bg-gold-deep hover:bg-gold-darker gap-2 text-white">
                <Plus className="size-4" />
                Créer une campagne SMS
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <SmsCampaignCard
              key={c.id}
              campaign={c}
              onView={() => router.push(`/sms/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
