export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getCampaignById } from "@/features/campaigns/server/queries";
import { getBatchMessages } from "@/features/email-mass/server/queries";
import { CampaignDetailPage } from "@/features/campaigns/components/campaign-detail-page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const [canUpdate, canCreate, canSend, canCancel, canDelete, recipients] =
    await Promise.all([
      hasPermission("campaigns.update.all"),
      hasPermission("campaigns.create.all"),
      hasPermission("campaigns.send.all"),
      hasPermission("campaigns.cancel.all"),
      hasPermission("campaigns.delete.all"),
      campaign.emailBatchId
        ? getBatchMessages(campaign.emailBatchId, 1, 50)
        : Promise.resolve({ messages: [], total: 0 }),
    ]);

  return (
    <CampaignDetailPage
      campaign={campaign}
      recipients={recipients}
      permissions={{ canUpdate, canCreate, canSend, canCancel, canDelete }}
    />
  );
}
