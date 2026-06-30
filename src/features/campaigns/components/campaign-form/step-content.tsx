"use client";

import { CampaignPreviewPanel } from "@/features/templates/components/campaign-preview-panel";
import type { CampaignFormState } from "./campaign-form";

interface Props {
  state: CampaignFormState;
  onChange: (patch: Partial<CampaignFormState>) => void;
}

export function StepContent({ state, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Contenu de la campagne
        </h2>
        <p className="text-text-muted text-sm">
          Articles, bouton d&apos;action et bannière (optionnels)
        </p>
      </div>

      <CampaignPreviewPanel
        campaignData={{
          articles: state.articles,
          ctaText: state.ctaText,
          ctaUrl: state.ctaUrl,
          bannerImageUrl: state.bannerImageUrl,
        }}
        onChange={(data) =>
          onChange({
            articles: data.articles,
            ctaText: data.ctaText,
            ctaUrl: data.ctaUrl,
            bannerImageUrl: data.bannerImageUrl,
          })
        }
      />
    </div>
  );
}
