import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopArticle } from "../types";

interface Props {
  articles: TopArticle[];
}

function formatFCFA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k`;
  return amount.toLocaleString("fr-FR");
}

export function TopArticlesCard({ articles }: Props) {
  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="text-gold-deep size-4" />
          <h3 className="text-text-primary text-sm font-semibold">Top articles</h3>
        </div>
        <Link
          href="/catalogue/articles"
          className="text-gold-deep hover:text-gold-darker text-xs transition-colors"
        >
          Voir tous →
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-text-muted py-6 text-center text-sm">
          Aucune vente sur cette période
        </p>
      ) : (
        <div>
          {articles.map((article, index) => (
            <Link
              key={article.articleId}
              href={`/catalogue/articles/${article.articleId}`}
              className="border-cream-darker hover:bg-cream/30 -mx-2 flex items-center gap-3 rounded-lg border-b px-2 py-2.5 transition-colors last:border-0"
            >
              <span
                className={cn(
                  "w-5 shrink-0 text-center text-sm font-bold",
                  index === 0
                    ? "text-gold-deep"
                    : index === 1
                      ? "text-gray-500"
                      : index === 2
                        ? "text-amber-600"
                        : "text-text-muted"
                )}
              >
                {index + 1}
              </span>

              <div className="bg-cream flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {article.mainImage ? (
                  <Image
                    src={article.mainImage}
                    alt={article.articleName}
                    width={40}
                    height={40}
                    className="size-10 object-cover"
                  />
                ) : (
                  <span className="text-lg">🛋️</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate text-sm font-medium">
                  {article.articleName}
                </p>
                <p className="text-text-muted text-[10px]">
                  Réf. {article.articleRef} · {article.quantitySold} vendu(s)
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-text-primary text-sm font-bold">
                  {formatFCFA(article.revenue)} FCFA
                </p>
                <p className="text-text-muted text-[10px]">
                  {article.salesCount} vente(s)
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
