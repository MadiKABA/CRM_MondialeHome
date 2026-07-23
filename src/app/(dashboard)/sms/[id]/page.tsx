export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import {
  getSmsCampaignById,
  getSmsCampaignRecipients,
} from "@/features/sms/server/queries";
import { SmsCampaignDetailPage } from "@/features/sms/components/sms-campaign-detail-page";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rpage?: string; rstatus?: string }>;
}

export default async function SmsCampaignPage({ params, searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const campaign = await getSmsCampaignById(id);
  if (!campaign) notFound();

  const { rpage, rstatus } = await searchParams;
  const page = Math.max(1, Number(rpage) || 1);
  const recipients = await getSmsCampaignRecipients(id, page, rstatus);

  return (
    <SmsCampaignDetailPage
      campaign={campaign}
      recipients={recipients}
      recipientsStatus={rstatus}
    />
  );
}
