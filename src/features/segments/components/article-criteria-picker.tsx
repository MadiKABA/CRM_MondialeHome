"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { searchArticlesForCriteria } from "../server/actions";

interface ArticleOption {
  id: string;
  name: string;
  reference: string;
  categoryName: string | null;
}

interface ArticleCriteriaPickerProps {
  value: string | null;
  label: string | null;
  onChange: (id: string, name: string) => void;
}

export function ArticleCriteriaPicker({
  value,
  label,
  onChange,
}: ArticleCriteriaPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [isPending, startTransition] = useTransition();

  useDebounce(
    () => {
      if (!open) return;
      startTransition(async () => {
        const result = await searchArticlesForCriteria(search);
        if (result.success && result.data) {
          setArticles(result.data);
        }
      });
    },
    300,
    [search, open]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="text-text-secondary h-8 w-full justify-start gap-2 text-xs font-normal"
          />
        }
      >
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">{label ?? "Sélectionner un article..."}</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-cream-darker border-b p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-text-muted size-4 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <p className="text-text-muted p-3 text-center text-xs">
              Aucun article trouvé
            </p>
          ) : (
            articles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => {
                  onChange(article.id, article.name);
                  setOpen(false);
                  setSearch("");
                }}
                className="hover:bg-cream/50 border-cream-darker flex w-full items-center gap-2 border-b px-3 py-2 text-left text-xs transition-colors last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate font-medium">{article.name}</p>
                  <p className="text-text-muted text-[11px]">
                    Réf. {article.reference}
                    {article.categoryName && ` · ${article.categoryName}`}
                  </p>
                </div>
                {value === article.id && (
                  <Check className="text-gold-deep size-3.5 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
