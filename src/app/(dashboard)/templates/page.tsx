export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getTemplates } from "@/features/templates/server/queries";
import { TemplatesPage } from "@/features/templates/components/templates-page";

interface Props {
  searchParams: Promise<{ channel?: string; search?: string; category?: string }>;
}

export default async function TemplatesListPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    hasPermission("templates.create.all"),
    hasPermission("templates.update.all"),
    hasPermission("templates.delete.all"),
  ]);

  const params = await searchParams;
  const channel = params.channel === "sms" ? "SMS" : "EMAIL";

  const data = await getTemplates({
    page: 1,
    limit: 20,
    channel,
    ...(params.search && { search: params.search }),
    ...(params.category && { category: params.category }),
  });

  return (
    <TemplatesPage
      initialData={data}
      channel={channel}
      permissions={{ canCreate, canUpdate, canDelete }}
    />
  );
}
