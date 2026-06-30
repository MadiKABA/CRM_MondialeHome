export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getCampaigns } from "@/features/campaigns/server/queries";
import { CampaignsPage } from "@/features/campaigns/components/campaigns-page";
import { campaignFiltersSchema } from "@/features/campaigns/schemas/campaign.schema";

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function CampagnesPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const filters = campaignFiltersSchema.parse({
    search: params.search,
    status: params.status,
    page: params.page,
  });

  const [canCreate, canUpdate, canSend, canCancel, canDelete, data] = await Promise.all([
    hasPermission("campaigns.create.all"),
    hasPermission("campaigns.update.all"),
    hasPermission("campaigns.send.all"),
    hasPermission("campaigns.cancel.all"),
    hasPermission("campaigns.delete.all"),
    getCampaigns(filters),
  ]);

  return (
    <CampaignsPage
      initialData={data}
      permissions={{ canCreate, canUpdate, canSend, canCancel, canDelete }}
    />
  );
}
