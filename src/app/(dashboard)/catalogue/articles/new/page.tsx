import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getCategoriesForSelect } from "@/features/catalogue/categories/server/queries";
import { ArticleForm } from "@/features/catalogue/articles/components/article-form";

export const metadata = { title: "Nouvel article — Mondial Home CRM" };

export default async function NewArticlePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canCreate = await hasPermission("articles.create.all");
  if (!canCreate) redirect("/catalogue/articles");

  const [categories, canManagePrices, canViewCost] = await Promise.all([
    getCategoriesForSelect(),
    hasPermission("articles.manage_prices"),
    hasPermission("articles.view_cost"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nouvel article</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ajoutez un nouveau produit au catalogue
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <ArticleForm
          categories={categories}
          canManagePrices={canManagePrices}
          canViewCost={canViewCost}
        />
      </div>
    </div>
  );
}
