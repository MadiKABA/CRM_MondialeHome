"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCampaign, updateCampaign } from "../../server/actions";
import { uploadCampaignImages } from "../../lib/cloudinary-upload";
import { StepInfo } from "./step-info";
import { StepTemplate } from "./step-template";
import { StepContent } from "./step-content";
import { StepSchedule } from "./step-schedule";
import { StepReview } from "./step-review";
import type { TemplateDTO } from "@/features/templates/types";
import type { SegmentDTO } from "@/features/segments/types";
import type {
  CampaignArticle,
  BannerData,
  FreeImage,
  CampaignContentMode,
} from "@/features/templates/types";

const STEPS = [
  { id: "info", label: "Informations" },
  { id: "template", label: "Template" },
  { id: "content", label: "Contenu" },
  { id: "schedule", label: "Planification" },
  { id: "review", label: "Récapitulatif" },
];

const INITIAL_BANNER: BannerData = {
  url: null,
  file: null,
  linkUrl: null,
  isUploaded: false,
};

export interface CampaignFormState {
  name: string;
  description: string;
  segmentId: string;
  templateId: string;
  contentMode: CampaignContentMode;
  articles: CampaignArticle[];
  freeImages: FreeImage[];
  ctaText: string;
  ctaUrl: string;
  banner: BannerData;
  campaignVars: Record<string, string>;
  scheduledAt: string | null;
}

interface Props {
  templates: TemplateDTO[];
  segments: SegmentDTO[];
  mode?: "create" | "edit";
  campaignId?: string;
  initialState?: Partial<CampaignFormState>;
}

export function CampaignForm({
  templates,
  segments,
  mode = "create",
  campaignId,
  initialState,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const isEdit = mode === "edit" && !!campaignId;

  const [formState, setFormState] = useState<CampaignFormState>({
    name: "",
    description: "",
    segmentId: "",
    templateId: "",
    contentMode: "articles",
    articles: [],
    freeImages: [],
    ctaText: "",
    ctaUrl: "",
    banner: INITIAL_BANNER,
    campaignVars: {},
    scheduledAt: null,
    ...initialState,
  });

  // Révoque les blob URLs restantes si l'utilisateur quitte le wizard sans
  // créer la campagne — évite de garder des fichiers en mémoire indéfiniment.
  const formStateRef = useRef(formState);
  useEffect(() => {
    formStateRef.current = formState;
  });
  useEffect(() => {
    return () => {
      const state = formStateRef.current;
      if (state.banner.url?.startsWith("blob:")) URL.revokeObjectURL(state.banner.url);
      for (const img of state.freeImages) {
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      }
    };
  }, []);

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
      setUploadStatus("Envoi des images vers Cloudinary...");
      const { banner, freeImages, errors } = await uploadCampaignImages(
        formState.banner,
        formState.freeImages
      );

      if (errors.length > 0) {
        toast.error(`Erreur lors de l'upload des images : ${errors.join(" · ")}`);
        return;
      }

      const campaignData = {
        contentMode: formState.contentMode,
        articles: formState.articles,
        freeImages: freeImages
          .filter(
            (img): img is FreeImage & { cloudinaryId: string } =>
              img.isUploaded && !!img.cloudinaryId
          )
          .map((img) => ({
            id: img.id,
            cloudinaryId: img.cloudinaryId,
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            linkUrl: img.linkUrl,
            width: img.width,
            height: img.height,
            layout: img.layout,
          })),
        ctaText: formState.ctaText || null,
        ctaUrl: formState.ctaUrl || null,
        bannerImageUrl: banner.url || null,
        bannerLinkUrl: banner.linkUrl || null,
        campaignVars: formState.campaignVars,
      };

      setUploadStatus(
        isEdit ? "Mise à jour de la campagne..." : "Création de la campagne..."
      );

      const result = isEdit
        ? await updateCampaign(campaignId!, {
            name: formState.name,
            description: formState.description || undefined,
            segmentId: formState.segmentId,
            templateId: formState.templateId,
            campaignData,
            scheduledAt: formState.scheduledAt ?? null,
          })
        : await createCampaign({
            name: formState.name,
            description: formState.description || undefined,
            segmentId: formState.segmentId,
            templateId: formState.templateId,
            campaignData,
            scheduledAt: formState.scheduledAt ?? undefined,
          });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const targetId = isEdit ? campaignId! : result.data?.id;
      if (!targetId) {
        toast.error("Erreur interne");
        return;
      }

      toast.success(
        isEdit
          ? `Campagne "${formState.name}" mise à jour`
          : `Campagne "${formState.name}" créée`
      );
      router.push(`/campagnes/${targetId}`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  return (
    <div className={cn("mx-auto space-y-6", step === 2 ? "max-w-5xl" : "max-w-3xl")}>
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
      <div
        className={cn(
          "border-cream-darker rounded-xl border bg-white",
          step === 2 ? "h-[640px] overflow-hidden" : "min-h-[400px] p-6"
        )}
      >
        {step === 0 && (
          <StepInfo state={formState} segments={segments} onChange={update} />
        )}
        {step === 1 && (
          <StepTemplate state={formState} templates={templates} onChange={update} />
        )}
        {step === 2 && (
          <StepContent state={formState} templates={templates} onChange={update} />
        )}
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
              className="bg-gold-deep hover:bg-gold-darker flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {uploadStatus ?? (isEdit ? "Mise à jour..." : "Création...")}
                </>
              ) : isEdit ? (
                "Enregistrer les modifications"
              ) : (
                "Créer la campagne →"
              )}
            </button>
          </div>
        )}
      </div>

      {isSubmitting && uploadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="mx-4 w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-center shadow-xl">
            <Loader2 className="text-gold-deep mx-auto size-8 animate-spin" />
            <div>
              <p className="text-text-primary text-sm font-semibold">{uploadStatus}</p>
              <p className="text-text-muted mt-1 text-xs">Ne fermez pas cette fenêtre</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
