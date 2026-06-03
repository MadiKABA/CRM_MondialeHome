"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ArticleSearchRow } from "./article-search-row";
import type { SaleFormValues } from "../../schemas/sale.schema";

export function ItemsEditor() {
  const {
    control,
    formState: { errors },
  } = useFormContext<SaleFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  function addLine() {
    append({
      articleId: null,
      articleName: "",
      articleRef: "",
      unitPrice: 0,
      quantity: 1,
      discount: 0,
    });
  }

  const itemsError =
    errors.items?.root?.message ??
    (errors.items as { message?: string } | undefined)?.message;

  return (
    <div className="space-y-3">
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_120px_100px_100px_40px] gap-2 px-1">
          <span className="text-muted-foreground text-xs font-medium">Article</span>
          <span className="text-muted-foreground text-center text-xs font-medium">
            Qté
          </span>
          <span className="text-muted-foreground text-right text-xs font-medium">
            Prix unit.
          </span>
          <span className="text-muted-foreground text-right text-xs font-medium">
            Remise
          </span>
          <span className="text-muted-foreground text-right text-xs font-medium">
            Total
          </span>
          <span />
        </div>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <ArticleSearchRow key={field.id} index={index} onRemove={() => remove(index)} />
        ))}
      </div>

      {itemsError && <p className="text-destructive text-sm">{itemsError}</p>}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLine}
        className="gap-2"
      >
        <Plus className="size-4" />
        Ajouter un article
      </Button>
    </div>
  );
}
