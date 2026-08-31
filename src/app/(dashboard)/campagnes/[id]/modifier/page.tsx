export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getCampaignById } from "@/features/campaigns/server/queries";
import {
  getActiveEmailTemplates,
  getTemplateById,
} from "@/features/templates/server/queries";
import { getAllSegments } from "@/features/segments/server/queries";
import { CampaignForm } from "@/features/campaigns/components/campaign-form/campaign-form";
import { campaignToFormState } from "@/features/campaigns/lib/campaign-mapper";
import { EDITABLE_STATUSES } from "@/features/campaigns/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canUpdate = await hasPermission("campaigns.update.all");
  if (!canUpdate) redirect("/campagnes");

  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  if (!EDITABLE_STATUSES.includes(campaign.status)) {
    redirect(`/campagnes/${id}`);
  }

  const [templates, segmentData] = await Promise.all([
    getActiveEmailTemplates(),
    getAllSegments(),
  ]);

  // Le template assigné a pu être désactivé depuis — on le garde dans la liste
  // pour que le wizard puisse toujours l'afficher comme sélection courante.
  let templateOptions = templates;
  if (campaign.templateId && !templates.some((t) => t.id === campaign.templateId)) {
    const currentTemplate = await getTemplateById(campaign.templateId);
    if (currentTemplate) templateOptions = [currentTemplate, ...templates];
  }

  const segments = [...segmentData.segments, ...segmentData.groups];

  return (
    <div className="space-y-4 p-6">
      <Link
        href={`/campagnes/${id}`}
        className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour à la campagne
      </Link>
      <h1 className="text-text-primary font-serif text-xl font-bold">
        Modifier la campagne
      </h1>
      <CampaignForm
        templates={templateOptions}
        segments={segments}
        mode="edit"
        campaignId={campaign.id}
        initialState={campaignToFormState(campaign)}
      />
    </div>
  );
}
