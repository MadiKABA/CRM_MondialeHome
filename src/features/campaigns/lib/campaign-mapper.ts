// Mappe une CampaignDTO (venant de la DB) vers le state initial du wizard
// CampaignForm — utilisé par la page /campagnes/[id]/modifier pour préremplir
// l'édition. Client-safe : pas de "server-only", utilisable depuis un Server
// Component comme depuis le worker.

import type { CampaignFormState } from "../components/campaign-form/campaign-form";
import type { CampaignDTO } from "../types";
import type { CampaignContentMode } from "@/features/templates/types";

function deduceContentMode(
  articlesCount: number,
  freeImagesCount: number
): CampaignContentMode {
  if (articlesCount > 0 && freeImagesCount > 0) return "both";
  if (freeImagesCount > 0) return "images";
  return "articles";
}

export function campaignToFormState(campaign: CampaignDTO): CampaignFormState {
  const data = campaign.campaignData;
  const articles = data?.articles ?? [];
  const freeImages = data?.freeImages ?? [];

  // Une date planifiée déjà passée ne peut pas être reproposée telle quelle.
  const scheduledAt =
    campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
      ? new Date(campaign.scheduledAt).toISOString()
      : null;

  return {
    name: campaign.name,
    description: campaign.description ?? "",
    segmentId: campaign.segmentId ?? "",
    templateId: campaign.templateId ?? "",
    contentMode:
      data?.contentMode ?? deduceContentMode(articles.length, freeImages.length),
    articles,
    freeImages: freeImages.map((img) => ({
      ...img,
      file: null,
      isUploaded: true,
    })),
    ctaText: data?.ctaText ?? "",
    ctaUrl: data?.ctaUrl ?? "",
    banner: {
      url: data?.bannerImageUrl ?? null,
      file: null,
      linkUrl: data?.bannerLinkUrl ?? null,
      isUploaded: !!data?.bannerImageUrl,
    },
    campaignVars: data?.campaignVars ?? {},
    scheduledAt,
  };
}
