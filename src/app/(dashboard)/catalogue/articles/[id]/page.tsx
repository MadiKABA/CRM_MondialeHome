import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/permissions/server";
import {
  getArticleById,
  getArticleCost,
} from "@/features/catalogue/articles/server/queries";
import { ArticleDetail } from "@/features/catalogue/articles/components/article-detail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  return {
    title: article ? `${article.name} — Mondiale Home CRM` : "Article introuvable",
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const canRead = await hasPermission("articles.read.all");
  if (!canRead) redirect("/dashboard");

  const { id } = await params;
  const [article, canEdit, canDelete] = await Promise.all([
    getArticleById(id),
    hasPermission("articles.update.all"),
    hasPermission("articles.delete.all"),
  ]);

  if (!article) notFound();

  // costPrice chargé séparément — null si pas la permission
  const cost = await getArticleCost(id);

  return (
    <div className="space-y-4">
      <Link
        href="/catalogue/articles"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft className="size-4" />
        Articles
      </Link>

      <ArticleDetail
        article={article}
        cost={cost}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
