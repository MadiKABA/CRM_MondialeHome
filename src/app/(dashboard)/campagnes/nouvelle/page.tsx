export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getActiveEmailTemplates } from "@/features/templates/server/queries";
import { getAllSegments } from "@/features/segments/server/queries";
import { CampaignForm } from "@/features/campaigns/components/campaign-form/campaign-form";

export default async function NewCampaignPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canCreate = await hasPermission("campaigns.create.all");
  if (!canCreate) redirect("/campagnes");

  const [templates, segmentData] = await Promise.all([
    getActiveEmailTemplates(),
    getAllSegments(),
  ]);

  const segments = [...segmentData.segments, ...segmentData.groups];

  return (
    <div className="p-6">
      <CampaignForm templates={templates} segments={segments} />
    </div>
  );
}
