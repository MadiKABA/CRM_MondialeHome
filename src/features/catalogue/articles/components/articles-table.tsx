"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArticleStatusBadge } from "./article-status-badge";
import { ArticleStockBadge } from "./article-stock-badge";
import { DeleteArticleDialog } from "./delete-article-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";
import type { ArticleListItemDTO } from "../types";

function formatPrice(price: number, currency = "XOF"): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface ArticlesTableProps {
  articles: ArticleListItemDTO[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ArticlesTable({ articles, canEdit, canDelete }: ArticlesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ArticleListItemDTO | null>(null);

  const allSelected = articles.length > 0 && selectedIds.length === articles.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : articles.map((a) => a.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-muted/30 mb-4 flex size-16 items-center justify-center rounded-full">
          <Package className="text-muted-foreground size-8" />
        </div>
        <h3 className="text-lg font-semibold">Aucun article dans le catalogue</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Commencez par ajouter votre premier article
        </p>
        {canEdit && (
          <Button className="mt-4" render={<Link href="/catalogue/articles/new" />}>
            + Ajouter un article
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        canDelete={canDelete}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Référence / Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow
                key={article.id}
                data-selected={selectedIds.includes(article.id)}
                className="data-[selected=true]:bg-accent/30"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(article.id)}
                    onCheckedChange={() => toggleOne(article.id)}
                    aria-label={`Sélectionner ${article.name}`}
                  />
                </TableCell>

                <TableCell>
                  {article.mainImage ? (
                    <Image
                      src={article.mainImage}
                      alt={article.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-12 items-center justify-center rounded-md">
                      <Package className="text-muted-foreground size-5" />
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/catalogue/articles/${article.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {article.name}
                    </Link>
                    <span className="text-muted-foreground font-mono text-xs">
                      {article.reference}
                    </span>
                    {article.isNew && (
                      <Badge variant="secondary" className="mt-0.5 w-fit text-xs">
                        Nouveauté
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground text-sm">
                  {article.categoryName ?? "—"}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {formatPrice(article.price, article.currency)}
                    </span>
                    {article.isOnPromo && article.promoPrice && (
                      <span className="text-xs text-emerald-600">
                        {formatPrice(article.promoPrice, article.currency)}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <ArticleStockBadge
                    stock={article.stock}
                    stockLevel={article.stockLevel}
                  />
                </TableCell>

                <TableCell>
                  <ArticleStatusBadge status={article.status} />
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Voir"
                      className="text-muted-foreground hover:text-foreground hover:bg-cream"
                      render={<Link href={`/catalogue/articles/${article.id}`} />}
                    >
                      <Eye className="size-4" />
                    </Button>

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Modifier"
                        className="text-gold-deep hover:text-gold-darker hover:bg-gold-light/30"
                        render={<Link href={`/catalogue/articles/${article.id}/edit`} />}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTarget(article)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <DeleteArticleDialog
          articleId={deleteTarget.id}
          articleName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
