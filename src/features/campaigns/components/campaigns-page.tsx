"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "./campaign-card";
import { CampaignsFilters } from "./campaigns-filters";
import { CancelCampaignDialog } from "./cancel-campaign-dialog";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";
import { duplicateCampaign, retryCampaign } from "../server/actions";
import type { CampaignDTO, PaginatedCampaigns } from "../types";

interface Props {
  initialData: PaginatedCampaigns;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canSend: boolean;
    canCancel: boolean;
    canDelete: boolean;
  };
}

export function CampaignsPage({ initialData, permissions }: Props) {
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<CampaignDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignDTO | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { campaigns, stats } = initialData;

  const handleDuplicate = async (c: CampaignDTO) => {
    setDuplicatingId(c.id);
    try {
      const result = await duplicateCampaign({ campaignId: c.id });
      if (result.success && result.data) {
        toast.success("Campagne dupliquée. Modifiez-la avant d'envoyer.");
        router.push(`/campagnes/${result.data.id}/modifier`);
      } else if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleRetry = async (c: CampaignDTO) => {
    setRetryingId(c.id);
    try {
      const result = await retryCampaign(c.id);
      if (result.success) {
        toast.success("Campagne remise en brouillon");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-text-primary font-serif text-2xl font-bold">Campagnes</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Créez et suivez vos campagnes d&apos;envoi en masse
          </p>
        </div>
        {permissions.canCreate && (
          <Link href="/campagnes/nouvelle">
            <Button className="bg-gold-deep hover:bg-gold-darker gap-2 text-white">
              <Plus className="size-4" />
              Nouvelle campagne
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: "📊" },
          { label: "Envoyées", value: stats.byStatus.SENT ?? 0, icon: "✅" },
          { label: "Planifiées", value: stats.byStatus.SCHEDULED ?? 0, icon: "🕐" },
          { label: "Taux ouv.", value: `${stats.avgOpenRate}%`, icon: "👁️" },
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

      <CampaignsFilters />

      {/* Liste */}
      {campaigns.length === 0 ? (
        <div className="border-cream-darker rounded-xl border-2 border-dashed p-16 text-center">
          <Send className="text-text-muted mx-auto mb-4 size-10" />
          <p className="text-text-secondary mb-1 text-base font-medium">
            Aucune campagne
          </p>
          <p className="text-text-muted mb-4 text-sm">
            Créez votre première campagne d&apos;envoi
          </p>
          {permissions.canCreate && (
            <Link href="/campagnes/nouvelle">
              <Button className="bg-gold-deep hover:bg-gold-darker gap-2 text-white">
                <Plus className="size-4" />
                Créer une campagne
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              permissions={permissions}
              onView={() => router.push(`/campagnes/${c.id}`)}
              onEdit={() => router.push(`/campagnes/${c.id}/modifier`)}
              onCancel={() => setCancelTarget(c)}
              onDuplicate={() => handleDuplicate(c)}
              onDelete={() => setDeleteTarget(c)}
              onRetry={() => handleRetry(c)}
              isDuplicating={duplicatingId === c.id}
              isRetrying={retryingId === c.id}
            />
          ))}
        </div>
      )}

      <CancelCampaignDialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null);
        }}
        campaign={cancelTarget}
        onSuccess={() => {
          setCancelTarget(null);
          router.refresh();
        }}
      />
      <DeleteCampaignDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        campaign={deleteTarget}
        onSuccess={() => {
          setDeleteTarget(null);
          router.refresh();
        }}
      />
    </div>
  );
}
