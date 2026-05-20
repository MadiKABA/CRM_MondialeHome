import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import {
  getArticles,
  getDistinctBrands,
} from "@/features/catalogue/articles/server/queries";
import { getCategoriesForSelect } from "@/features/catalogue/categories/server/queries";
import { articleFiltersSchema } from "@/features/catalogue/articles/schemas/article.schema";
import { ArticlesTable } from "@/features/catalogue/articles/components/articles-table";
import { ArticlesFilters } from "@/features/catalogue/articles/components/articles-filters";
import { ArticlesStats } from "@/features/catalogue/articles/components/articles-stats";
import { ExportButton } from "@/features/catalogue/articles/components/export-button";

export const metadata = { title: "Articles — Mondial Home CRM" };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function ArticlesContent({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const filters = articleFiltersSchema.parse(searchParams);
  const [result, categories, brands] = await Promise.all([
    getArticles(filters),
    getCategoriesForSelect(),
    getDistinctBrands(),
  ]);

  const [canEdit, canDelete] = await Promise.all([
    hasPermission("articles.update.all"),
    hasPermission("articles.delete.all"),
  ]);

  return (
    <div className="space-y-4">
      <ArticlesStats stats={result.stats} />

      <ArticlesFilters categories={categories} brands={brands} />

      <ArticlesTable articles={result.articles} canEdit={canEdit} canDelete={canDelete} />

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {result.total} article(s) — page {result.page}/{result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`?page=${result.page - 1}`} />}
              >
                ← Précédent
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`?page=${result.page + 1}`} />}
              >
                Suivant →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [canCreate, canExport, canViewCost] = await Promise.all([
    hasPermission("articles.create.all"),
    hasPermission("articles.export.all"),
    hasPermission("articles.view_cost"),
  ]);

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez votre catalogue de produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && <ExportButton canViewCost={canViewCost} />}
          {canCreate && (
            <Button render={<Link href="/catalogue/articles/new" />} className="gap-2">
              <Plus className="size-4" />
              Nouvel article
            </Button>
          )}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <ArticlesContent searchParams={params} />
      </Suspense>
    </div>
  );
}
