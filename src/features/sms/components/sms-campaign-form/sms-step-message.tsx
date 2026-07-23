"use client";

import { useMemo, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { SmsCharacterMeter } from "../sms-character-meter";
import { SmsPreviewBubble } from "../sms-preview-bubble";
import { SmsVariablesPanel } from "../sms-variables-panel";
import type { SmsCampaignFormState } from "../../types";
import type { TemplateDTO } from "@/features/templates/types";

interface Props {
  state: SmsCampaignFormState;
  templates: TemplateDTO[];
  eligibleCount: number;
  onChange: (patch: Partial<SmsCampaignFormState>) => void;
}

export function SmsStepMessage({ state, templates, eligibleCount, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const analysis = useMemo(() => analyzeMessage(state.content), [state.content]);
  const totalCost = analysis.costPerClient * eligibleCount;

  const handleSelectTemplate = (template: TemplateDTO) => {
    onChange({ templateId: template.id, content: template.content ?? "" });
  };

  const handleWriteDirectly = () => {
    onChange({ templateId: null });
  };

  const handleInsertVariable = (variable: string) => {
    const el = textareaRef.current;
    const cursorPos = el?.selectionStart ?? state.content.length;
    const next =
      state.content.slice(0, cursorPos) + variable + state.content.slice(cursorPos);
    onChange({ content: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Message
        </h2>
        <p className="text-text-muted text-sm">
          Choisissez un template existant ou rédigez directement le SMS
        </p>
      </div>

      {templates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-text-primary text-sm font-medium">
            Template SMS (optionnel)
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleWriteDirectly}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                !state.templateId
                  ? "bg-gold-deep border-gold-deep text-white"
                  : "border-cream-darker text-text-secondary hover:border-gold/50 hover:bg-cream"
              }`}
            >
              Rédiger directement
            </button>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  state.templateId === t.id
                    ? "bg-gold-deep border-gold-deep text-white"
                    : "border-cream-darker text-text-secondary hover:border-gold/50 hover:bg-cream"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Textarea
            ref={textareaRef}
            value={state.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder={
              "Bonjour {{prenom}}, profitez de -{{reduction}}% sur {{produit}} !"
            }
            rows={5}
            className="border-cream-darker focus:border-gold resize-none text-sm leading-relaxed"
          />
          <SmsCharacterMeter analysis={analysis} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-text-primary text-sm font-medium">Produit</label>
              <input
                value={state.produit}
                onChange={(e) => onChange({ produit: e.target.value })}
                placeholder="Ex : Canapé Oslo"
                maxLength={50}
                className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-text-primary text-sm font-medium">
                Réduction (%)
              </label>
              <input
                value={state.reduction}
                onChange={(e) =>
                  onChange({
                    reduction: e.target.value.replace(/[^\d]/g, "").slice(0, 3),
                  })
                }
                placeholder="Ex : 20"
                className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {eligibleCount > 0 && (
            <p className="bg-cream/50 text-text-secondary rounded-lg p-3 text-xs">
              Coût total estimé : <strong>{eligibleCount}</strong> clients ×{" "}
              <strong>{analysis.costPerClient} FCFA</strong> ={" "}
              <strong>{totalCost.toLocaleString("fr-FR")} FCFA</strong>
            </p>
          )}

          <SmsVariablesPanel usedIn={state.content} onInsert={handleInsertVariable} />
        </div>

        <div className="border-cream-darker overflow-hidden rounded-xl border">
          <SmsPreviewBubble
            message={state.content}
            produit={state.produit}
            reduction={state.reduction}
          />
        </div>
      </div>
    </div>
  );
}
