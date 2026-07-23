export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getActiveSmsTemplates } from "@/features/templates/server/queries";
import { getSegmentsWithSmsEligibility } from "@/features/sms/server/queries";
import { SmsCampaignForm } from "@/features/sms/components/sms-campaign-form/sms-campaign-form";

export default async function NewSmsCampaignPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canCreate = await hasPermission("campaigns.create.all");
  if (!canCreate) redirect("/campagnes");

  const [templates, segments] = await Promise.all([
    getActiveSmsTemplates(),
    getSegmentsWithSmsEligibility(),
  ]);

  return (
    <div className="p-6">
      <SmsCampaignForm segments={segments} templates={templates} />
    </div>
  );
}
