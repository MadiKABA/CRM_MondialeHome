"use client";

import { useState, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Search, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SaleFormValues } from "../../schemas/sale.schema";

interface ArticleOption {
  id: string;
  reference: string;
  name: string;
  price: number;
  stock: number;
  mainImage: string | null;
}

interface ArticleSearchRowProps {
  index: number;
  onRemove: () => void;
}

async function searchArticles(query: string): Promise<ArticleOption[]> {
  const params = new URLSearchParams({ q: query, limit: "8" });
  const res = await fetch(`/api/articles/search?${params}`);
  if (!res.ok) return [];
  return res.json() as Promise<ArticleOption[]>;
}

export function ArticleSearchRow({ index, onRemove }: ArticleSearchRowProps) {
  const { register, control, watch, setValue } = useFormContext<SaleFormValues>();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleOption | null>(null);

  const quantity = watch(`items.${index}.quantity`) ?? 1;
  const unitPrice = watch(`items.${index}.unitPrice`) ?? 0;
  const discount = watch(`items.${index}.discount`) ?? 0;
  const lineTotal = Math.max(0, unitPrice * quantity - discount);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await searchArticles(q);
    setResults(data);
    setLoading(false);
  }, []);

  useDebounce(
    () => {
      void search(query);
    },
    300,
    [query]
  );

  function selectArticle(article: ArticleOption) {
    setSelectedArticle(article);
    setValue(`items.${index}.articleId`, article.id);
    setValue(`items.${index}.articleName`, article.name);
    setValue(`items.${index}.articleRef`, article.reference);
    setValue(`items.${index}.unitPrice`, article.price);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="grid grid-cols-[1fr_80px_120px_100px_100px_40px] items-start gap-2">
      {/* Article */}
      <div>
        {selectedArticle ? (
          <div className="border-border bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{selectedArticle.name}</p>
              <p className="text-muted-foreground text-xs">{selectedArticle.reference}</p>
            </div>
            {selectedArticle.stock < 5 && selectedArticle.stock > 0 && (
              <AlertCircle
                className="size-3.5 shrink-0 text-amber-500"
                aria-label={`Stock faible : ${selectedArticle.stock}`}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
              onClick={() => setSelectedArticle(null)}
            >
              ×
            </Button>
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="text-muted-foreground h-9 w-full justify-start gap-2 text-sm font-normal"
                />
              }
            >
              <Search className="size-3.5 shrink-0" />
              Rechercher un article...
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="border-b p-2">
                <Input
                  placeholder="Nom, référence..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {loading && (
                  <p className="text-muted-foreground p-3 text-center text-sm">
                    Recherche...
                  </p>
                )}
                {!loading && query.length < 2 && (
                  <p className="text-muted-foreground p-3 text-center text-sm">
                    Tapez au moins 2 caractères
                  </p>
                )}
                {!loading && query.length >= 2 && results.length === 0 && (
                  <p className="text-muted-foreground p-3 text-center text-sm">
                    Aucun article trouvé
                  </p>
                )}
                {results.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
                    onClick={() => selectArticle(art)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{art.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {art.reference} · {formatCurrency(art.price)}
                      </p>
                    </div>
                    {art.stock === 0 && (
                      <span className="text-xs text-red-500">Rupture</span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {/* Champs cachés */}
        <input type="hidden" {...register(`items.${index}.articleName`)} />
        <input type="hidden" {...register(`items.${index}.articleRef`)} />
        <input type="hidden" {...register(`items.${index}.articleId`)} />
      </div>

      {/* Quantité */}
      <div>
        <Controller
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              min={1}
              max={9999}
              className="h-9 text-center"
            />
          )}
        />
      </div>

      {/* Prix unitaire */}
      <div>
        <Controller
          control={control}
          name={`items.${index}.unitPrice`}
          render={({ field }) => (
            <Input {...field} type="number" min={0} className="h-9 text-right" />
          )}
        />
      </div>

      {/* Remise ligne */}
      <div>
        <Controller
          control={control}
          name={`items.${index}.discount`}
          render={({ field }) => (
            <Input {...field} type="number" min={0} className="h-9 text-right" />
          )}
        />
      </div>

      {/* Total ligne */}
      <div className="flex h-9 items-center justify-end">
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(lineTotal)}
        </span>
      </div>

      {/* Supprimer */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-9"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
