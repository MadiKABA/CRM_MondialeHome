export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getTemplateById } from "@/features/templates/server/queries";
import { TemplateDetailPage } from "@/features/templates/components/template-detail-page";

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

  return (
    <TemplateDetailPage template={template} permissions={{ canUpdate, canDelete }} />
  );
}
