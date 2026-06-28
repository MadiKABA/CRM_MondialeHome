export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getTemplates } from "@/features/templates/server/queries";
import { TemplatesPage } from "@/features/templates/components/templates-page";

export default async function TemplatesListPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    hasPermission("templates.create.all"),
    hasPermission("templates.update.all"),
    hasPermission("templates.delete.all"),
  ]);

  const data = await getTemplates({ page: 1, limit: 20 });

  return (
    <TemplatesPage initialData={data} permissions={{ canCreate, canUpdate, canDelete }} />
  );
}
