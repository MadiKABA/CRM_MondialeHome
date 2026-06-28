"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchArticlesForPreview } from "../server/actions";
import type { CampaignArticle } from "../types";

interface ArticlePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds: string[];
  onSelect: (article: CampaignArticle) => void;
}

export function ArticlePicker({
  open,
  onOpenChange,
  excludeIds,
  onSelect,
}: ArticlePickerProps) {
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<CampaignArticle[]>([]);
  const [isPending, startTransition] = useTransition();

  const excludeKey = excludeIds.join(",");

  // Reset state when dialog closes
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setSearch("");
      setArticles([]);
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  // Search articles when search term or excludeIds change
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchArticlesForPreview(search, excludeIds);
        if (result.success && result.data) {
          setArticles(result.data);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open, excludeKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-serif">
            Sélectionner un article
          </DialogTitle>
          <DialogDescription>
            Choisissez un article du catalogue pour la prévisualisation
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="border-cream-darker focus:border-gold pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-text-muted size-5 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">
                {search ? "Aucun article trouvé" : "Commencez à taper pour rechercher"}
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => onSelect(article)}
                className="hover:bg-cream/50 hover:border-cream-darker flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-colors"
              >
                {article.mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.mainImage}
                    alt={article.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-cream flex size-12 shrink-0 items-center justify-center rounded-lg text-xl">
                    🛋️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate text-sm font-medium">
                    {article.name}
                  </p>
                  <p className="text-text-muted text-xs">
                    Réf. {article.reference} · {article.price.toLocaleString("fr-FR")}{" "}
                    FCFA
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
