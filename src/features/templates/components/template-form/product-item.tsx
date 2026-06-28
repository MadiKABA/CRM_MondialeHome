"use client";

import { useFormContext } from "react-hook-form";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";

interface ProductItemProps {
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ProductItem({
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ProductItemProps) {
  const form = useFormContext<CreateEmailTemplateInput>();
  const title = form.watch(`products.${index}.title`);
  const originalPrice = form.watch(`products.${index}.originalPrice`);
  const promoPrice = form.watch(`products.${index}.promoPrice`);

  const discount =
    originalPrice && promoPrice && promoPrice > 0 && promoPrice < originalPrice
      ? Math.round(((originalPrice - promoPrice) / originalPrice) * 100)
      : null;

  return (
    <div className="border-cream-darker rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-text-secondary text-xs font-medium">
          Produit {index + 1}
          {title ? ` — ${title.slice(0, 30)}${title.length > 30 ? "…" : ""}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className={cn(
              "rounded p-0.5 text-gray-400 transition-colors",
              index === 0
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-gray-100 hover:text-gray-600"
            )}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className={cn(
              "rounded p-0.5 text-gray-400 transition-colors",
              index === total - 1
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-gray-100 hover:text-gray-600"
            )}
          >
            <ChevronDown className="size-3.5" />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <FormField
          control={form.control}
          name={`products.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nom du produit"
                  className="border-cream-darker focus:border-gold h-8 text-xs"
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`products.${index}.imageUrl`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://... (URL de l'image)"
                  className="border-cream-darker focus:border-gold h-8 text-xs"
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <FormField
            control={form.control}
            name={`products.${index}.originalPrice`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder="Prix (XOF)"
                    className="border-cream-darker focus:border-gold h-8 text-xs"
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`products.${index}.promoPrice`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder="Prix promo (XOF)"
                    className="border-cream-darker focus:border-gold h-8 text-xs"
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
        </div>

        {discount !== null && (
          <p className="text-gold-darker text-[11px] font-medium">
            Réduction calculée : -{discount}%
          </p>
        )}

        <FormField
          control={form.control}
          name={`products.${index}.linkUrl`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://... (lien du produit)"
                  className="border-cream-darker focus:border-gold h-8 text-xs"
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
