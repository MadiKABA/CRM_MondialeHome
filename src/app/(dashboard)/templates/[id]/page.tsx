export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getTemplateById } from "@/features/templates/server/queries";
import { buildEmailHtml } from "@/features/templates/lib/html-builder";
import {
  DEFAULT_CLIENT_DATA,
  DEFAULT_CAMPAIGN_VARS,
} from "@/features/templates/lib/renderer";
import { TemplateDetailPage } from "@/features/templates/components/template-detail-page";
import { SmsTemplateDetailPage } from "@/features/sms/components/sms-template-detail-page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemplatePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  const [canUpdate, canDelete] = await Promise.all([
    hasPermission("templates.update.all"),
    hasPermission("templates.delete.all"),
  ]);

  if (template.channel === "SMS") {
    return (
      <SmsTemplateDetailPage template={template} permissions={{ canUpdate, canDelete }} />
    );
  }

  let previewHtml: string | null = null;
  try {
    previewHtml = buildEmailHtml({
      campaignType: template.category ?? "Promotion",
      productCategory: template.productCategory ?? null,
      subject: template.subject ?? "",
      content: template.content ?? null,
      conclusion: template.conclusion ?? null,
      articles: [],
      ctaText: null,
      ctaUrl: null,
      bannerImageUrl: null,
      clientData: DEFAULT_CLIENT_DATA,
      campaignVars: DEFAULT_CAMPAIGN_VARS,
    });
  } catch {
    // preview non bloquante
  }

  return (
    <TemplateDetailPage
      template={template}
      previewHtml={previewHtml}
      permissions={{ canUpdate, canDelete }}
    />
  );
}
