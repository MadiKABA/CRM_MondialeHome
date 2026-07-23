"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSmsCampaign, sendSmsCampaign } from "../../server/actions";
import { SmsStepInfo } from "./sms-step-info";
import { SmsStepMessage } from "./sms-step-message";
import { SmsStepSchedule } from "./sms-step-schedule";
import { SmsStepReview } from "./sms-step-review";
import type { SmsCampaignFormState, SmsSegmentDTO } from "../../types";
import type { TemplateDTO } from "@/features/templates/types";

const STEPS = [
  { id: "info", label: "Informations" },
  { id: "message", label: "Message" },
  { id: "schedule", label: "Planification" },
  { id: "review", label: "Récapitulatif" },
];

const INITIAL_STATE: SmsCampaignFormState = {
  name: "",
  description: "",
  segmentId: "",
  templateId: null,
  content: "",
  produit: "",
  reduction: "",
  scheduledAt: null,
};

interface Props {
  segments: SmsSegmentDTO[];
  templates: TemplateDTO[];
}

export function SmsCampaignForm({ segments, templates }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<SmsCampaignFormState>(INITIAL_STATE);

  const update = (patch: Partial<SmsCampaignFormState>) =>
    setFormState((prev) => ({ ...prev, ...patch }));

  const selectedSegment = segments.find((s) => s.id === formState.segmentId);

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return formState.name.trim().length >= 2 && !!formState.segmentId;
      case 1:
        return formState.content.trim().length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createSmsCampaign({
        name: formState.name,
        description: formState.description || undefined,
        segmentId: formState.segmentId,
        templateId: formState.templateId,
        content: formState.content,
        campaignVars: {
          produit: formState.produit || null,
          reduction: formState.reduction || null,
        },
        scheduledAt: formState.scheduledAt ?? undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Sans date de planification : "Créer la campagne" envoie immédiatement.
      // Avec date : createSmsCampaign a déjà créé la campagne en statut SCHEDULED.
      if (!formState.scheduledAt && result.data) {
        const sendResult = await sendSmsCampaign({ campaignId: result.data.id });
        if (!sendResult.success) {
          toast.error(`Campagne créée mais l'envoi a échoué : ${sendResult.error}`);
          router.push("/campagnes");
          router.refresh();
          return;
        }
        toast.success(`Campagne SMS "${formState.name}" en cours d'envoi`);
      } else {
        toast.success(`Campagne SMS "${formState.name}" planifiée`);
      }

      router.push("/campagnes");
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
          <SmsStepInfo state={formState} segments={segments} onChange={update} />
        )}
        {step === 1 && (
          <SmsStepMessage
            state={formState}
            templates={templates}
            eligibleCount={selectedSegment?.smsEligibleCount ?? 0}
            onChange={update}
          />
        )}
        {step === 2 && <SmsStepSchedule state={formState} onChange={update} />}
        {step === 3 && (
          <SmsStepReview
            state={formState}
            segment={selectedSegment}
            eligibleCount={selectedSegment?.smsEligibleCount ?? 0}
          />
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
              className="bg-gold-deep hover:bg-gold-darker flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création...
                </>
              ) : formState.scheduledAt ? (
                "Planifier la campagne →"
              ) : (
                "Créer la campagne →"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
