"use client";

import { Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignFormState } from "./campaign-form";

interface Props {
  state: CampaignFormState;
  onChange: (patch: Partial<CampaignFormState>) => void;
}

// Convertit un ISO string (UTC) → valeur affichable dans <input type="datetime-local">
function isoToLocalInputValue(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

// Convertit la valeur datetime-local (heure locale, sans timezone) → ISO 8601 avec "Z"
function localInputValueToIso(localValue: string): string {
  // new Date() interprète la chaîne comme heure locale du navigateur
  return new Date(localValue).toISOString();
}

function getMinLocalValue(): string {
  return isoToLocalInputValue(new Date(Date.now() + 5 * 60_000).toISOString());
}

export function StepSchedule({ state, onChange }: Props) {
  const isScheduled = !!state.scheduledAt;
  const minLocal = getMinLocalValue();

  const handleSelectNow = () => {
    onChange({ scheduledAt: null });
  };

  const handleSelectSchedule = () => {
    // Valeur par défaut : maintenant + 5 min, stockée en ISO complet
    onChange({ scheduledAt: new Date(Date.now() + 5 * 60_000).toISOString() });
  };

  const handleDateChange = (localValue: string) => {
    if (!localValue) {
      onChange({ scheduledAt: null });
      return;
    }
    onChange({ scheduledAt: localInputValueToIso(localValue) });
  };

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
          onClick={handleSelectNow}
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
          onClick={handleSelectSchedule}
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
            min={minLocal}
            value={state.scheduledAt ? isoToLocalInputValue(state.scheduledAt) : minLocal}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none"
          />
          <p className="text-text-muted text-xs">
            Heure locale de votre navigateur — convertie automatiquement
          </p>
        </div>
      )}
    </div>
  );
}
