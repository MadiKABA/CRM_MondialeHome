"use client";

import { Mail } from "lucide-react";
import type { CampaignFormState } from "./campaign-form";
import type { TemplateDTO } from "@/features/templates/types";

interface Props {
  state: CampaignFormState;
  templates: TemplateDTO[];
  onChange: (patch: Partial<CampaignFormState>) => void;
}

export function StepTemplate({ state, templates, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Choisir un template
        </h2>
        <p className="text-text-muted text-sm">
          Sélectionnez le modèle d&apos;email pour cette campagne
        </p>
      </div>

      {templates.length === 0 ? (
        <p className="bg-cream/50 text-text-muted rounded-lg p-4 text-sm">
          Aucun template actif. Créez-en un dans Templates.
        </p>
      ) : (
        <div className="grid max-h-[400px] grid-cols-2 gap-3 overflow-auto pr-1">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ templateId: t.id })}
              className={`overflow-hidden rounded-xl border text-left transition-all ${
                state.templateId === t.id
                  ? "border-gold-deep ring-gold-deep ring-1"
                  : "border-cream-darker hover:border-gold/40"
              }`}
            >
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ backgroundColor: t.headerConfig.bgColor }}
              >
                <span className="text-lg">{t.headerConfig.icon}</span>
                <p className="truncate text-xs font-bold tracking-wide text-white uppercase">
                  {t.headerConfig.title}
                </p>
              </div>
              <div className="p-3">
                <p className="text-text-primary flex items-center gap-1.5 truncate text-sm font-medium">
                  <Mail className="text-text-muted size-3.5 shrink-0" />
                  {t.name}
                </p>
                <p className="text-text-muted mt-1 truncate text-xs">{t.subject}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
