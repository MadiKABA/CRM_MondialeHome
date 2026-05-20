"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, Package, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleStatusBadge } from "./article-status-badge";
import { ArticleStockBadge } from "./article-stock-badge";
import { DeleteArticleDialog } from "./delete-article-dialog";
import { UpdateStockDialog } from "./update-stock-dialog";
import type { ArticleDetailDTO, ArticleCostDTO } from "../types";

function formatPrice(price: number, currency = "XOF"): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface ArticleDetailProps {
  article: ArticleDetailDTO;
  cost: ArticleCostDTO | null;
  canEdit: boolean;
  canDelete: boolean;
}

export function ArticleDetail({ article, cost, canEdit, canDelete }: ArticleDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(article.mainImage ?? null);

  const allImages = [
    ...(article.mainImage ? [article.mainImage] : []),
    ...article.images.filter((img) => img !== article.mainImage),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ArticleStatusBadge status={article.status} />
            {article.isNew && (
              <Badge className="bg-amber-100 text-amber-700">Nouveauté</Badge>
            )}
            <span className="text-muted-foreground font-mono text-sm">
              {article.reference}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold">{article.name}</h1>
          {article.categoryPath && (
            <p className="text-muted-foreground text-sm">{article.categoryPath}</p>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              className="gap-2"
              render={<Link href={`/catalogue/articles/${article.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Modifier
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gauche : galerie photos + description */}
        <div className="space-y-4 lg:col-span-2">
          {allImages.length > 0 ? (
            <div className="space-y-2">
              <div className="bg-muted/30 relative aspect-video overflow-hidden rounded-xl border">
                <Image
                  src={(activeImage ?? allImages[0]) as string}
                  alt={article.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        (activeImage ?? allImages[0]) === img
                          ? "border-primary"
                          : "hover:border-border border-transparent"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Photo ${i + 1}`}
                        width={72}
                        height={54}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/20 flex aspect-video items-center justify-center rounded-xl border">
              <Package className="text-muted-foreground size-16" />
            </div>
          )}

          {article.description && (
            <div className="space-y-2">
              <h2 className="font-heading text-base font-semibold">Description</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {article.description}
              </p>
            </div>
          )}

          {Object.keys(article.attributes).length > 0 && (
            <div className="space-y-2">
              <h2 className="font-heading text-base font-semibold">Attributs</h2>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(article.attributes).map(([k, v]) => (
                  <div key={k} className="bg-muted/20 rounded-lg p-2">
                    <dt className="text-muted-foreground text-xs">{k}</dt>
                    <dd className="text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Droite : infos + prix + stock */}
        <div className="space-y-4">
          {/* Informations */}
          <div className="bg-card space-y-3 rounded-xl border p-4">
            <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Informations
            </h2>
            {[
              { label: "Marque", value: article.brand },
              { label: "Couleur", value: article.color },
              { label: "Matière", value: article.material },
              { label: "Dimensions", value: article.dimensions },
              { label: "Poids", value: article.weight ? `${article.weight} kg` : null },
              { label: "Fournisseur", value: article.supplier },
              {
                label: "Code-barres",
                value: article.barcode ? (
                  <span className="font-mono">{article.barcode}</span>
                ) : null,
              },
            ]
              .filter((item) => item.value)
              .map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}
          </div>

          {/* Prix */}
          <div className="bg-card space-y-3 rounded-xl border p-4">
            <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Prix & Stock
            </h2>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix de vente</span>
              <span className="text-lg font-bold">
                {formatPrice(article.price, article.currency)}
              </span>
            </div>

            {article.isOnPromo && article.promoPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prix promo</span>
                <span className="font-medium text-emerald-600">
                  {formatPrice(article.promoPrice, article.currency)}
                  <span className="ml-1 text-xs">
                    (-
                    {Math.round(
                      ((article.price - article.promoPrice) / article.price) * 100
                    )}
                    %)
                  </span>
                </span>
              </div>
            )}

            {cost && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix d&apos;achat</span>
                  <span className="font-medium">
                    {cost.costPrice ? formatPrice(cost.costPrice, article.currency) : "—"}
                  </span>
                </div>
                {cost.margin !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BarChart3 className="size-3.5" />
                      Marge
                    </span>
                    <span
                      className={`font-semibold ${cost.margin > 30 ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {cost.margin}%{" "}
                      {cost.marginAmount
                        ? `(${formatPrice(cost.marginAmount, article.currency)})`
                        : ""}
                    </span>
                  </div>
                )}
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stock</span>
              <div className="flex items-center gap-3">
                <ArticleStockBadge
                  stock={article.stock}
                  stockLevel={article.stockLevel}
                />
                <span className="text-muted-foreground text-xs">
                  / alerte : {article.stockAlert}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setStockOpen(true)}
            >
              Mettre à jour le stock
            </Button>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="bg-card space-y-2 rounded-xl border p-4">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteArticleDialog
        articleId={article.id}
        articleName={article.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectAfterDelete
      />

      <UpdateStockDialog
        articleId={article.id}
        articleName={article.name}
        currentStock={article.stock}
        open={stockOpen}
        onOpenChange={setStockOpen}
      />
    </div>
  );
}
