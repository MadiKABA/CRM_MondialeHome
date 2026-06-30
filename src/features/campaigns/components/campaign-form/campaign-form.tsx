"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCampaign } from "../../server/actions";
import { StepInfo } from "./step-info";
import { StepTemplate } from "./step-template";
import { StepContent } from "./step-content";
import { StepSchedule } from "./step-schedule";
import { StepReview } from "./step-review";
import type { TemplateDTO } from "@/features/templates/types";
import type { SegmentDTO } from "@/features/segments/types";
import type { CampaignArticle } from "@/features/templates/types";

const STEPS = [
  { id: "info", label: "Informations" },
  { id: "template", label: "Template" },
  { id: "content", label: "Contenu" },
  { id: "schedule", label: "Planification" },
  { id: "review", label: "Récapitulatif" },
];

export interface CampaignFormState {
  name: string;
  description: string;
  segmentId: string;
  templateId: string;
  articles: CampaignArticle[];
  ctaText: string;
  ctaUrl: string;
  bannerImageUrl: string;
  campaignVars: Record<string, string>;
  scheduledAt: string | null;
}

interface Props {
  templates: TemplateDTO[];
  segments: SegmentDTO[];
}

export function CampaignForm({ templates, segments }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState<CampaignFormState>({
    name: "",
    description: "",
    segmentId: "",
    templateId: "",
    articles: [],
    ctaText: "",
    ctaUrl: "",
    bannerImageUrl: "",
    campaignVars: {},
    scheduledAt: null,
  });

  const update = (patch: Partial<CampaignFormState>) =>
    setFormState((prev) => ({ ...prev, ...patch }));

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return formState.name.trim().length >= 2 && !!formState.segmentId;
      case 1:
        return !!formState.templateId;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createCampaign({
        name: formState.name,
        description: formState.description || undefined,
        segmentId: formState.segmentId,
        templateId: formState.templateId,
        campaignData: {
          articles: formState.articles,
          ctaText: formState.ctaText || null,
          ctaUrl: formState.ctaUrl || null,
          bannerImageUrl: formState.bannerImageUrl || null,
          campaignVars: formState.campaignVars,
        },
        scheduledAt: formState.scheduledAt ?? undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.error("Erreur interne");
        return;
      }

      toast.success(`Campagne "${formState.name}" créée`);
      router.push(`/campagnes/${result.data.id}`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                  i < step
                    ? "bg-gold-deep text-white"
                    : i === step
                      ? "border-gold-deep bg-gold-light/50 text-gold-deep border-2"
                      : "border-cream-darker bg-cream text-text-muted border"
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-center text-[10px]",
                  i === step ? "text-gold-deep font-medium" : "text-text-muted"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "-mt-5 h-0.5 flex-1",
                  i < step ? "bg-gold-deep" : "bg-cream-darker"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenu de l'étape */}
      <div className="border-cream-darker min-h-[400px] rounded-xl border bg-white p-6">
        {step === 0 && (
          <StepInfo state={formState} segments={segments} onChange={update} />
        )}
        {step === 1 && (
          <StepTemplate state={formState} templates={templates} onChange={update} />
        )}
        {step === 2 && <StepContent state={formState} onChange={update} />}
        {step === 3 && <StepSchedule state={formState} onChange={update} />}
        {step === 4 && (
          <StepReview state={formState} templates={templates} segments={segments} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-text-secondary hover:text-text-primary text-sm transition-opacity disabled:opacity-0"
        >
          ← Précédent
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canNext() && setStep((s) => s + 1)}
            disabled={!canNext()}
            className="bg-gold-deep hover:bg-gold-darker rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40"
          >
            Suivant →
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/campagnes")}
              disabled={isSubmitting}
              className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gold-deep hover:bg-gold-darker rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {isSubmitting ? "Création..." : "Créer la campagne →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
