"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Copy, Ban, Send, Mail, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { CampaignStatsCards } from "./campaign-stats-cards";
import { CampaignProgressBar } from "./campaign-progress-bar";
import { CampaignRecipientsTable } from "./campaign-recipients-table";
import { CampaignEmailPreview } from "./campaign-email-preview";
import { SendNowDialog } from "./send-now-dialog";
import { CancelCampaignDialog } from "./cancel-campaign-dialog";
import { duplicateCampaign } from "../server/actions";
import { EDITABLE_STATUSES } from "../types";
import type { CampaignDTO } from "../types";
import type { MessageLogDTO } from "@/features/email-mass/types";

const TABS = [
  { id: "preview", label: "Email envoyé", icon: Mail },
  { id: "recipients", label: "Destinataires", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  campaign: CampaignDTO;
  recipients: { messages: MessageLogDTO[]; total: number };
  permissions: {
    canUpdate: boolean;
    canCreate: boolean;
    canSend: boolean;
    canCancel: boolean;
    canDelete: boolean;
  };
}

export function CampaignDetailPage({ campaign, recipients, permissions }: Props) {
  const router = useRouter();
  const [sendOpen, setSendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("preview");
  const [isDuplicating, setIsDuplicating] = useState(false);

  const canSendNow = permissions.canSend && campaign.status === "DRAFT";
  const canCancel =
    permissions.canCancel && ["SCHEDULED", "SENDING", "PAUSED"].includes(campaign.status);
  const canEdit = permissions.canUpdate && EDITABLE_STATUSES.includes(campaign.status);
  const canDuplicate = permissions.canCreate && campaign.status !== "SENDING";

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateCampaign({ campaignId: campaign.id });
      if (result.success && result.data) {
        toast.success("Campagne dupliquée. Modifiez-la avant d'envoyer.");
        router.push(`/campagnes/${result.data.id}/modifier`);
      } else if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  const dateToShow = campaign.scheduledAt ?? campaign.sentAt ?? campaign.createdAt;
  const dateLabel = campaign.scheduledAt
    ? "Planifiée pour"
    : campaign.sentAt
      ? "Envoyée le"
      : "Créée le";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href="/campagnes">
            <Button variant="ghost" size="sm" className="text-text-secondary gap-1.5">
              <ArrowLeft className="size-4" />
              Campagnes
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-text-primary font-serif text-xl font-bold">
                {campaign.name}
              </h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            {campaign.description && (
              <p className="text-text-muted mt-0.5 text-sm">{campaign.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canSendNow && (
            <Button
              size="sm"
              onClick={() => setSendOpen(true)}
              className="bg-gold-deep hover:bg-gold-darker gap-1.5 text-white"
            >
              <Send className="size-4" />
              Envoyer maintenant
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Ban className="size-4" />
              Annuler
            </Button>
          )}
          {canEdit && (
            <Link href={`/campagnes/${campaign.id}/modifier`}>
              <Button
                variant="outline"
                size="sm"
                className="border-cream-darker hover:bg-cream gap-1.5"
              >
                <Pencil className="size-4" />
                Modifier
              </Button>
            </Link>
          )}
          {canDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="border-cream-darker hover:bg-cream gap-1.5"
            >
              {isDuplicating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
              Dupliquer
            </Button>
          )}
        </div>
      </div>

      <CampaignProgressBar
        sentCount={campaign.sentCount}
        totalCount={campaign.totalCount}
        status={campaign.status}
      />

      <CampaignStatsCards campaign={campaign} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">Segment</p>
          <p className="text-text-primary text-sm font-medium">
            {campaign.segmentName} ({campaign.segmentCount} clients)
          </p>
        </div>
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">Template</p>
          <p className="text-text-primary text-sm font-medium">
            {campaign.templateName ?? "—"}
          </p>
        </div>
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">{dateLabel}</p>
          <p className="text-text-primary text-sm font-medium">
            {dateToShow
              ? new Date(dateToShow).toLocaleString("fr-FR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Onglets — chaque contenu d'onglet gère déjà sa propre carte (bordure/bg) */}
      <div>
        <div className="border-cream-darker mb-4 flex border-b">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-gold-deep text-gold-deep"
                  : "text-text-secondary hover:text-text-primary border-transparent"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {tab.id === "recipients" && recipients.total > 0 && (
                <span className="bg-cream-darker text-text-muted rounded-full px-1.5 py-0.5 text-[10px]">
                  {recipients.total}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "preview" &&
          (campaign.templateId ? (
            <CampaignEmailPreview campaign={campaign} />
          ) : (
            <div className="border-cream-darker flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-center">
              <Mail className="text-text-muted size-10" />
              <p className="text-text-muted text-sm">
                Aucun template associé à cette campagne
              </p>
            </div>
          ))}

        {activeTab === "recipients" && (
          <CampaignRecipientsTable
            messages={recipients.messages}
            total={recipients.total}
          />
        )}
      </div>

      <SendNowDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        campaign={campaign}
        onSuccess={() => {
          setSendOpen(false);
          router.refresh();
        }}
      />
      <CancelCampaignDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        campaign={campaign}
        onSuccess={() => {
          setCancelOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
