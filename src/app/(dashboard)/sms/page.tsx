export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getSmsCampaigns } from "@/features/sms/server/queries";
import { smsCampaignFiltersSchema } from "@/features/sms/schemas/sms.schema";
import { SmsCampaignsPage } from "@/features/sms/components/sms-campaigns-page";

interface Props {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function SmsCampaignsListPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const filters = smsCampaignFiltersSchema.parse({
    search: params.search,
    status: params.status,
    page: params.page,
  });

  const [canCreate, data] = await Promise.all([
    hasPermission("campaigns.create.all"),
    getSmsCampaigns(filters),
  ]);

  return <SmsCampaignsPage initialData={data} permissions={{ canCreate }} />;
}
