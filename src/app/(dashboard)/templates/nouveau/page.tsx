export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { TemplateForm } from "@/features/templates/components/template-form/template-form";

export default async function NewTemplatePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canCreate = await hasPermission("templates.create.all");
  if (!canCreate) redirect("/templates");

  return (
    <div className="mx-auto max-w-7xl p-6">
      <TemplateForm mode="create" />
    </div>
  );
}
