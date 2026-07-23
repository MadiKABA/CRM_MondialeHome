import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, XCircle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { SmsCampaignRecipientsTable } from "./sms-campaign-recipients-table";
import type { SmsCampaignDTO, SmsRecipientDTO } from "../types";

interface Props {
  campaign: SmsCampaignDTO;
  recipients: {
    recipients: SmsRecipientDTO[];
    total: number;
    page: number;
    totalPages: number;
  };
  recipientsStatus?: string;
}

export function SmsCampaignDetailPage({ campaign, recipients, recipientsStatus }: Props) {
  const dateToShow = campaign.scheduledAt ?? campaign.sentAt ?? campaign.createdAt;
  const dateLabel = campaign.scheduledAt
    ? "Planifiée pour"
    : campaign.sentAt
      ? "Envoyée le"
      : "Créée le";

  const stats = [
    { Icon: Send, label: "Envoyés", value: campaign.totalSent },
    { Icon: CheckCircle2, label: "Délivrés", value: campaign.totalDelivered },
    { Icon: XCircle, label: "Échecs", value: campaign.totalFailed },
    { Icon: Coins, label: "Taux de délivrance", value: `${campaign.deliveryRate}%` },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href="/sms">
            <Button variant="ghost" size="sm" className="text-text-secondary gap-1.5">
              <ArrowLeft className="size-4" />
              Campagnes SMS
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-cream-darker flex items-center gap-3 rounded-xl border bg-white p-4"
          >
            <s.Icon className="text-gold-deep size-5 shrink-0" />
            <div>
              <p className="text-text-primary text-xl font-bold">{s.value}</p>
              <p className="text-text-muted text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Infos + coût */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">Segment</p>
          <p className="text-text-primary text-sm font-medium">
            {campaign.segmentName} ({campaign.segmentCount} clients)
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
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">Coût estimé</p>
          <p className="text-text-primary text-sm font-medium">
            {campaign.costEstimated.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <div className="border-cream-darker space-y-2 rounded-xl border bg-white p-4">
          <p className="text-text-muted text-xs">Coût réel</p>
          <p className="text-text-primary text-sm font-medium">
            {campaign.costActual.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
      </div>

      {/* Message envoyé */}
      <div className="border-cream-darker rounded-xl border bg-white p-4">
        <h2 className="text-text-primary mb-3 text-sm font-semibold">Message</h2>
        <div className="max-w-[280px] rounded-2xl rounded-bl-sm bg-[#E7FFDB] px-4 py-2.5 text-sm break-words text-gray-800 shadow-sm">
          {campaign.message}
        </div>
      </div>

      {/* Destinataires */}
      <SmsCampaignRecipientsTable
        recipients={recipients.recipients}
        total={recipients.total}
        page={recipients.page}
        totalPages={recipients.totalPages}
        status={recipientsStatus}
      />
    </div>
  );
}
