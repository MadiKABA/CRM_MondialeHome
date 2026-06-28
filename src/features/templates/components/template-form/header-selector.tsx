"use client";

import { useFormContext } from "react-hook-form";
import { CAMPAIGN_TYPES, PRODUCT_CATEGORIES, getHeaderConfig } from "../../types";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";

export function HeaderSelector() {
  const { watch, setValue } = useFormContext<CreateEmailTemplateInput>();
  const category = watch("category");
  const productCategory = watch("productCategory");

  const currentHeader = category ? getHeaderConfig(category, productCategory) : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-text-primary text-xs font-medium">Type de campagne</label>
        <div className="flex flex-wrap gap-1.5">
          {CAMPAIGN_TYPES.map((type) => {
            const config = getHeaderConfig(type);
            const isSelected = category === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setValue("category", isSelected ? null : type)}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all"
                style={
                  isSelected
                    ? {
                        backgroundColor: config.bgColor,
                        borderColor: config.bgColor,
                        color: "#fff",
                      }
                    : {
                        borderColor: "#e5e2d8",
                        color: "#666",
                        backgroundColor: "transparent",
                      }
                }
              >
                <span>{config.icon}</span>
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {(category === "Promotion" || category === "Arrivage") && (
        <div className="space-y-1.5">
          <label className="text-text-primary text-xs font-medium">
            Catégorie produit (optionnel)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_CATEGORIES.map((cat) => {
              const isSelected = productCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValue("productCategory", isSelected ? null : cat)}
                  className="rounded-full border px-2.5 py-1 text-xs transition-all"
                  style={
                    isSelected
                      ? {
                          backgroundColor: "#8B6914",
                          borderColor: "#8B6914",
                          color: "#fff",
                        }
                      : {
                          borderColor: "#e5e2d8",
                          color: "#888",
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentHeader && (
        <div
          className="rounded-lg px-3 py-2 text-center text-sm font-medium"
          style={{
            backgroundColor: currentHeader.bgColor,
            color: currentHeader.textColor,
          }}
        >
          <span className="mr-1.5">{currentHeader.icon}</span>
          {currentHeader.title}
        </div>
      )}
    </div>
  );
}
