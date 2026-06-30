import {
  Users,
  Mail,
  Image as ImageIcon,
  MousePointerClick,
  Clock,
  Send,
} from "lucide-react";
import type { CampaignFormState } from "./campaign-form";
import type { TemplateDTO } from "@/features/templates/types";
import type { SegmentDTO } from "@/features/segments/types";

interface Props {
  state: CampaignFormState;
  templates: TemplateDTO[];
  segments: SegmentDTO[];
}

export function StepReview({ state, templates, segments }: Props) {
  const template = templates.find((t) => t.id === state.templateId);
  const segment = segments.find((s) => s.id === state.segmentId);

  const rows = [
    {
      Icon: Users,
      label: "Segment",
      value: `${segment?.name ?? "—"} (${segment?.memberCount ?? 0} clients)`,
    },
    {
      Icon: Mail,
      label: "Template",
      value: template?.name ?? "—",
    },
    {
      Icon: ImageIcon,
      label: "Articles",
      value: `${state.articles.length} article(s) sélectionné(s)`,
    },
    {
      Icon: MousePointerClick,
      label: "Bouton CTA",
      value: state.ctaText || "Aucun",
    },
    {
      Icon: state.scheduledAt ? Clock : Send,
      label: "Envoi",
      value: state.scheduledAt
        ? new Date(state.scheduledAt).toLocaleString("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "Immédiatement après création",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Récapitulatif
        </h2>
        <p className="text-text-muted text-sm">
          Vérifiez les informations avant de créer la campagne
        </p>
      </div>

      <div className="border-cream-darker bg-cream/30 rounded-xl border p-4">
        <p className="text-text-primary text-sm font-semibold">{state.name}</p>
        {state.description && (
          <p className="text-text-muted mt-1 text-xs">{state.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <row.Icon className="text-gold-deep mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-text-muted text-xs">{row.label}</p>
              <p className="text-text-primary text-sm font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!state.scheduledAt && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            ⚠️ Cette campagne sera envoyée immédiatement dès sa création. Cliquez sur
            &quot;Créer la campagne&quot; pour confirmer.
          </p>
        </div>
      )}
    </div>
  );
}
