import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import { getArticleById } from "@/features/catalogue/articles/server/queries";
import { getCategoriesForSelect } from "@/features/catalogue/categories/server/queries";
import { ArticleForm } from "@/features/catalogue/articles/components/article-form";

export const metadata = { title: "Modifier l'article — Mondial Home CRM" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canEdit = await hasPermission("articles.update.all");
  if (!canEdit) redirect("/catalogue/articles");

  const { id } = await params;
  const [article, categories, canManagePrices, canViewCost] = await Promise.all([
    getArticleById(id),
    getCategoriesForSelect(),
    hasPermission("articles.manage_prices"),
    hasPermission("articles.view_cost"),
  ]);

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Modifier l&apos;article</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">
          {article.reference}
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <ArticleForm
          article={article}
          categories={categories}
          canManagePrices={canManagePrices}
          canViewCost={canViewCost}
        />
      </div>
    </div>
  );
}
