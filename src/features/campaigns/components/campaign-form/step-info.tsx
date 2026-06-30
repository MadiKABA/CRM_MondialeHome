"use client";

import { Users } from "lucide-react";
import type { CampaignFormState } from "./campaign-form";
import type { SegmentDTO } from "@/features/segments/types";

interface Props {
  state: CampaignFormState;
  segments: SegmentDTO[];
  onChange: (patch: Partial<CampaignFormState>) => void;
}

export function StepInfo({ state, segments, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Informations générales
        </h2>
        <p className="text-text-muted text-sm">
          Nommez votre campagne et choisissez les destinataires
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-text-primary text-sm font-medium">
          Nom de la campagne *
        </label>
        <input
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex : Promo Soldes Janvier 2026"
          className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-text-primary text-sm font-medium">
          Description <span className="text-text-muted font-normal">(optionnel)</span>
        </label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          placeholder="Note interne sur l'objectif de cette campagne..."
          className="border-cream-darker focus:border-gold w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-text-primary flex items-center gap-1.5 text-sm font-medium">
          <Users className="text-gold-deep size-4" />
          Segment cible *
        </label>
        {segments.length === 0 ? (
          <p className="bg-cream/50 text-text-muted rounded-lg p-3 text-sm">
            Aucun segment disponible. Créez-en un dans Segments.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto pr-1">
            {segments.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => onChange({ segmentId: seg.id })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  state.segmentId === seg.id
                    ? "border-gold-deep bg-gold-light/30"
                    : "border-cream-darker hover:border-gold/40 hover:bg-cream/30"
                }`}
              >
                <p className="text-text-primary truncate text-sm font-medium">
                  {seg.icon ?? "👥"} {seg.name}
                </p>
                <p className="text-text-muted mt-0.5 text-xs">
                  {seg.memberCount} client(s)
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
