"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Save, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmailPreview } from "../email-preview";
import { VariablesPanel } from "../variables-panel";
import { HeaderSelector } from "./header-selector";
import { SubjectEditor } from "./subject-editor";
import { ContentEditor } from "./content-editor";
import { SendTestDialog } from "../send-test-dialog";
import {
  CampaignPreviewPanel,
  type CampaignPreviewData,
} from "../campaign-preview-panel";
import {
  createEmailTemplateSchema,
  type CreateEmailTemplateInput,
} from "../../schemas/template.schema";
import {
  createEmailTemplate,
  updateEmailTemplate,
  generatePreviewHtml,
} from "../../server/actions";
import type { TemplateDTO } from "../../types";

const INITIAL_CAMPAIGN_DATA: CampaignPreviewData = {
  articles: [],
  ctaText: "",
  ctaUrl: "",
  bannerImageUrl: "",
};

interface TemplateFormProps {
  mode: "create" | "edit";
  template?: TemplateDTO;
}

interface ActiveFieldRef {
  getValue: () => string;
  setValue: (val: string) => void;
  cursorPos: number;
}

export function TemplateForm({ mode, template }: TemplateFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const [campaignData, setCampaignData] =
    useState<CampaignPreviewData>(INITIAL_CAMPAIGN_DATA);
  const activeFieldRef = useRef<ActiveFieldRef | null>(null);

  const form = useForm<CreateEmailTemplateInput>({
    resolver: zodResolver(createEmailTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      category: template?.category ?? undefined,
      productCategory: template?.productCategory ?? undefined,
      language: "fr",
      subject: template?.subject ?? "",
      preheader: template?.preheader ?? "",
      content: template?.content ?? "",
      conclusion: template?.conclusion ?? "",
    },
  });

  const {
    formState: { isSubmitting, errors },
  } = form;
  const subject = form.watch("subject");
  const category = form.watch("category");
  const productCategory = form.watch("productCategory");
  const content = form.watch("content");
  const conclusion = form.watch("conclusion");

  // Regénère la preview en temps réel avec les données du formulaire ET les données campagne simulées
  useEffect(() => {
    if (!subject?.trim()) return;

    const timer = setTimeout(async () => {
      setIsGenerating(true);
      try {
        const result = await generatePreviewHtml({
          templateData: form.getValues(),
          bannerImageUrl: campaignData.bannerImageUrl || null,
          previewArticles: campaignData.articles.map((a) => ({
            id: a.id,
            name: a.name,
            reference: a.reference,
            price: a.price,
            promoPrice: a.promoPrice ?? null,
            mainImage: a.mainImage || null,
            linkUrl: a.linkUrl || null,
          })),
          ctaText: campaignData.ctaText || null,
          ctaUrl: campaignData.ctaUrl || null,
        });
        if (result.success && result.data) {
          setPreviewHtml(result.data.html);
        }
      } finally {
        setIsGenerating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, category, productCategory, content, conclusion, campaignData]);

  const handleInsertVariable = (variable: string) => {
    if (!activeFieldRef.current) {
      toast.info("Cliquez dans un champ texte avant d'insérer une variable");
      return;
    }
    const { getValue, setValue, cursorPos } = activeFieldRef.current;
    const current = getValue();
    setValue(current.slice(0, cursorPos) + variable + current.slice(cursorPos));
  };

  const onSubmit = (values: CreateEmailTemplateInput) => {
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createEmailTemplate(values)
            : await updateEmailTemplate(template!.id, values);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(
          mode === "create"
            ? `Template "${values.name}" créé avec succès`
            : `Template "${values.name}" modifié`
        );
        router.push("/templates");
        router.refresh();
      } catch {
        toast.error("Une erreur est survenue");
      }
    });
  };

  const allTexts = [subject, content, conclusion].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/templates">
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Templates
            </Button>
          </Link>
          <h1 className="text-text-primary font-serif text-xl font-bold">
            {mode === "create"
              ? "Nouveau template email"
              : `Modifier "${template?.name}"`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && template && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSendTestOpen(true)}
              className="border-cream-darker hover:bg-cream hidden gap-2 sm:flex"
            >
              <Send className="size-4" />
              Tester
            </Button>
          )}

          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {mode === "create" ? "Créer" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bandeau informatif architecture */}
      <div className="border-gold/30 bg-gold-light/20 flex items-start gap-3 rounded-xl border p-3">
        <Info className="text-gold-deep mt-0.5 size-4 shrink-0" />
        <div className="text-gold-darker text-sm">
          <p className="font-medium">Structure réutilisable</p>
          <p className="text-text-secondary mt-0.5 text-xs">
            Le template définit la mise en page et les textes fixes. Les{" "}
            <strong>articles, le bouton CTA et la bannière</strong> seront choisis lors de
            chaque campagne. Utilisez le panneau &quot;Simuler une campagne&quot;
            ci-dessous pour les voir dans la prévisualisation.
          </p>
        </div>
      </div>

      {/* FormProvider wrap le formulaire pour donner accès au contexte */}
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
            {/* Colonne formulaire (2/5) */}
            <div className="space-y-4 lg:col-span-2">
              {/* Informations générales */}
              <div className="border-cream-darker space-y-4 rounded-xl border bg-white p-4">
                <h2 className="text-text-primary text-sm font-semibold">
                  Informations générales
                </h2>

                <div className="space-y-1.5">
                  <label className="text-text-primary text-xs font-medium">
                    Nom du template *
                  </label>
                  <input
                    {...form.register("name")}
                    placeholder="Ex : Promo Soldes Canapés Janvier"
                    className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <HeaderSelector />
              </div>

              {/* Objet email */}
              <div className="border-cream-darker rounded-xl border bg-white p-4">
                <SubjectEditor
                  onFocus={(getValue, setValue, pos) => {
                    activeFieldRef.current = { getValue, setValue, cursorPos: pos };
                  }}
                />
              </div>

              {/* Introduction */}
              <div className="border-cream-darker rounded-xl border bg-white p-4">
                <ContentEditor
                  label="Introduction"
                  name="content"
                  placeholder={
                    "Bonjour {{prenom}} 👋\n\nNous avons une offre exceptionnelle pour vous..."
                  }
                  onFocus={(getValue, setValue, pos) => {
                    activeFieldRef.current = { getValue, setValue, cursorPos: pos };
                  }}
                />
              </div>

              {/* Conclusion */}
              <div className="border-cream-darker rounded-xl border bg-white p-4">
                <ContentEditor
                  label="Conclusion"
                  name="conclusion"
                  placeholder={
                    "Offre valable jusqu'au {{date_expiration}}.\n\nÀ bientôt,\nL'équipe {{nom_boutique}}"
                  }
                  onFocus={(getValue, setValue, pos) => {
                    activeFieldRef.current = { getValue, setValue, cursorPos: pos };
                  }}
                />
              </div>

              {/* Panel de simulation des données campagne (pour la preview uniquement) */}
              <CampaignPreviewPanel
                campaignData={campaignData}
                onChange={setCampaignData}
              />
            </div>

            {/* Colonne preview (2/5) */}
            <div className="lg:sticky lg:top-4 lg:col-span-2">
              <div
                className="border-cream-darker overflow-hidden rounded-xl border bg-white"
                style={{ height: "calc(100vh - 120px)" }}
              >
                <EmailPreview
                  html={previewHtml}
                  isLoading={isGenerating}
                  subject={subject}
                />
              </div>
            </div>

            {/* Colonne variables (1/5) */}
            <div className="lg:sticky lg:top-4 lg:col-span-1">
              <div
                className="border-cream-darker overflow-auto rounded-xl border bg-white p-3"
                style={{ maxHeight: "calc(100vh - 120px)" }}
              >
                <VariablesPanel usedIn={allTexts} onInsert={handleInsertVariable} />
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      {mode === "edit" && template && (
        <SendTestDialog
          open={sendTestOpen}
          onOpenChange={setSendTestOpen}
          templateId={template.id}
          templateName={template.name}
        />
      )}
    </div>
  );
}
