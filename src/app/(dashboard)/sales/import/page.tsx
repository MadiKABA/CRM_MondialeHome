import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { checkPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { SalesImportWizard } from "@/features/sales/components/import/sales-import-wizard";

export const metadata = { title: "Importer des ventes — Mondial Home CRM" };

export default async function ImportSalesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  await checkPermission(PERMISSIONS.SALES_CREATE_ALL);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Importer l&apos;historique des ventes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Importez les ventes depuis votre ancienne application au format CSV ou Excel
        </p>
      </div>
      <SalesImportWizard />
    </div>
  );
}
