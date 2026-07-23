export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { TemplateForm } from "@/features/templates/components/template-form/template-form";
import { ChannelPicker } from "@/features/templates/components/channel-picker";
import { SmsTemplateForm } from "@/features/sms/components/sms-template-form";

interface Props {
  searchParams: Promise<{ channel?: string }>;
}

export default async function NewTemplatePage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canCreate = await hasPermission("templates.create.all");
  if (!canCreate) redirect("/templates");

  const { channel } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {channel === "sms" ? (
        <SmsTemplateForm mode="create" />
      ) : channel === "email" ? (
        <TemplateForm mode="create" />
      ) : (
        <ChannelPicker />
      )}
    </div>
  );
}
