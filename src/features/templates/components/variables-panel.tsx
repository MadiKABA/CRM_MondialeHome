"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMAIL_VARIABLES, groupVariablesByCategory } from "../lib/variables";

interface VariablesPanelProps {
  usedIn: string[];
  onInsert: (variable: string) => void;
}

export function VariablesPanel({ usedIn, onInsert }: VariablesPanelProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["Client", "Campagne"])
  );

  const usedVariables = new Set(
    usedIn.flatMap((text) => text.match(/\{\{[a-z_]+\}\}/g) ?? [])
  );

  const grouped = groupVariablesByCategory(EMAIL_VARIABLES);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      <p className="text-text-muted mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
        Variables disponibles
      </p>
      <p className="text-text-muted mb-3 px-1 text-[11px]">
        Cliquez pour insérer à la position du curseur
      </p>

      {Object.entries(grouped).map(([category, vars]) => {
        const isOpen = openCategories.has(category);

        return (
          <div key={category}>
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="text-text-secondary hover:text-text-primary hover:bg-cream/50 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="size-3.5 shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0" />
              )}
              {category}
              <span className="text-text-muted ml-auto text-[10px] font-normal">
                {vars.length}
              </span>
            </button>

            {isOpen && (
              <div className="mt-1 mb-2 space-y-1 pl-2">
                {vars.map((v) => {
                  const isUsed = usedVariables.has(v.code);
                  return (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => onInsert(v.code)}
                      title={v.description}
                      className={cn(
                        "w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-all hover:shadow-sm",
                        isUsed
                          ? "bg-gold-light/40 border-gold/30"
                          : "bg-cream/50 border-cream-darker hover:bg-cream"
                      )}
                    >
                      <span
                        className={cn(
                          "block font-mono text-[11px] font-medium",
                          isUsed ? "text-gold-darker" : "text-text-secondary"
                        )}
                      >
                        {v.code}
                      </span>
                      <span className="text-text-muted mt-0.5 block text-[10px]">
                        Ex : {v.example}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {usedVariables.size > 0 && (
        <div className="bg-gold-light/20 border-gold/20 mt-4 rounded-lg border p-2.5">
          <p className="text-gold-darker mb-1 text-[11px] font-medium">
            Variables utilisées ({usedVariables.size})
          </p>
          <div className="flex flex-wrap gap-1">
            {[...usedVariables].map((v) => (
              <span
                key={v}
                className="bg-gold-light/50 text-gold-darker rounded px-1.5 py-0.5 font-mono text-[10px]"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
