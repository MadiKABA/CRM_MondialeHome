import { cn } from "@/lib/utils";
import { SMS_VARIABLES } from "../lib/variables";

interface SmsVariablesPanelProps {
  usedIn: string;
  onInsert: (variable: string) => void;
}

export function SmsVariablesPanel({ usedIn, onInsert }: SmsVariablesPanelProps) {
  const usedVariables = new Set(usedIn.match(/\{\{[a-z_]+\}\}/g) ?? []);

  return (
    <div className="space-y-1">
      <p className="text-text-muted mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
        Variables disponibles
      </p>
      <p className="text-text-muted mb-3 px-1 text-[11px]">
        {"{{produit}} et {{reduction}} seront définis à la création de la campagne"}
      </p>

      <div className="space-y-1.5">
        {SMS_VARIABLES.map((v) => {
          const isUsed = usedVariables.has(v.code);
          return (
            <button
              key={v.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onInsert(v.code);
              }}
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
                {v.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
