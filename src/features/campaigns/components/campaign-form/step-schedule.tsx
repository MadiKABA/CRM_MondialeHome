"use client";

import { useState } from "react";
import { Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignFormState } from "./campaign-form";

interface Props {
  state: CampaignFormState;
  onChange: (patch: Partial<CampaignFormState>) => void;
}

export function StepSchedule({ state, onChange }: Props) {
  const isScheduled = !!state.scheduledAt;
  const [minDate] = useState(() =>
    new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Planification
        </h2>
        <p className="text-text-muted text-sm">Choisissez quand envoyer cette campagne</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ scheduledAt: null })}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-5 transition-all",
            !isScheduled
              ? "border-gold-deep bg-gold-light/30"
              : "border-cream-darker hover:border-gold/40"
          )}
        >
          <Send className="text-gold-deep size-6" />
          <p className="text-text-primary text-sm font-medium">Envoyer maintenant</p>
          <p className="text-text-muted text-center text-xs">
            La campagne sera envoyée dès la création
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange({ scheduledAt: minDate })}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-5 transition-all",
            isScheduled
              ? "border-gold-deep bg-gold-light/30"
              : "border-cream-darker hover:border-gold/40"
          )}
        >
          <Clock className="text-gold-deep size-6" />
          <p className="text-text-primary text-sm font-medium">Planifier</p>
          <p className="text-text-muted text-center text-xs">
            Choisir une date et heure futures
          </p>
        </button>
      </div>

      {isScheduled && (
        <div className="space-y-1.5">
          <label className="text-text-primary text-sm font-medium">
            Date et heure d&apos;envoi
          </label>
          <input
            type="datetime-local"
            min={minDate}
            value={state.scheduledAt ?? minDate}
            onChange={(e) => onChange({ scheduledAt: e.target.value })}
            className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none"
          />
          <p className="text-text-muted text-xs">Heure de Dakar (UTC+0)</p>
        </div>
      )}
    </div>
  );
}
