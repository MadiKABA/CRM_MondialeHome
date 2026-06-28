"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductItem } from "./product-item";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";
import { nanoid } from "nanoid";

export function ProductsEditor() {
  const form = useFormContext<CreateEmailTemplateInput>();
  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const canAdd = fields.length < 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-text-primary text-sm font-semibold">
          Produits mis en avant
          <span className="text-text-muted ml-1.5 text-xs font-normal">
            ({fields.length}/4)
          </span>
        </h2>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id: nanoid(),
                title: "",
                imageUrl: null,
                originalPrice: null,
                promoPrice: null,
                linkUrl: null,
              })
            }
            className="border-cream-darker hover:bg-cream h-7 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="border-cream-darker rounded-lg border-2 border-dashed p-6 text-center">
          <Package className="text-text-muted mx-auto mb-2 size-7" />
          <p className="text-text-muted text-xs">Aucun produit — optionnel</p>
          <p className="text-text-muted mt-0.5 text-[11px]">
            Ajoutez jusqu&apos;à 4 produits à mettre en avant
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <ProductItem
              key={field.id}
              index={index}
              total={fields.length}
              onRemove={() => remove(index)}
              onMoveUp={() => index > 0 && swap(index, index - 1)}
              onMoveDown={() => index < fields.length - 1 && swap(index, index + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
