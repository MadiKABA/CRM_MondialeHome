export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getTemplateById } from "@/features/templates/server/queries";
import { TemplateForm } from "@/features/templates/components/template-form/template-form";
import { SmsTemplateForm } from "@/features/sms/components/sms-template-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canUpdate = await hasPermission("templates.update.all");
  if (!canUpdate) redirect("/templates");

  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-7xl p-6">
      {template.channel === "SMS" ? (
        <SmsTemplateForm mode="edit" template={template} />
      ) : (
        <TemplateForm mode="edit" template={template} />
      )}
    </div>
  );
}
