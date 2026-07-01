"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailPreview } from "@/features/templates/components/email-preview";
import { getEmailPreviewForCampaign } from "../server/actions";
import type { CampaignDTO } from "../types";

interface Props {
  campaign: CampaignDTO;
}

export function CampaignEmailPreview({ campaign }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await getEmailPreviewForCampaign(campaign.id);
      if (!result.success) {
        setError(result.error);
      } else if (result.data) {
        setHtml(result.data.html);
        setSubject(result.data.subject);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => generate(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  if (error) {
    return (
      <div className="border-cream-darker flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-16 text-center">
        <AlertTriangle className="size-8 text-red-400" />
        <div>
          <p className="text-text-primary text-sm font-medium">Aperçu indisponible</p>
          <p className="text-text-muted mt-0.5 text-xs">{error}</p>
        </div>
        <button
          type="button"
          onClick={generate}
          className="text-gold-deep hover:text-gold-darker text-xs underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="text-gold-deep hover:text-gold-darker border-gold/30 hover:bg-gold-light/20 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div
        className="border-cream-darker overflow-hidden rounded-xl border"
        style={{ height: "640px" }}
      >
        <EmailPreview html={html} isLoading={isPending} subject={subject} />
      </div>

      <p className="text-text-muted text-center text-[11px]">
        Prévisualisation avec données de test : <strong>Mamadou Diop</strong> · Dakar. Les
        vraies données de chaque client sont utilisées à l&apos;envoi.
      </p>
    </div>
  );
}
