import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { checkPermission } from "@/lib/permissions/server";
import { getExistingReferences } from "@/features/catalogue/articles/server/import-actions";
import { ImportWizard } from "@/features/catalogue/articles/components/import/import-wizard";

export const metadata = { title: "Importer des articles — Mondiale Home CRM" };

export default async function ImportArticlesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  await checkPermission("articles.import.all");

  const existingRefs = await getExistingReferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Importer des articles</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Importez votre catalogue depuis un fichier CSV ou Excel
        </p>
      </div>
      <ImportWizard existingReferences={existingRefs} />
    </div>
  );
}
