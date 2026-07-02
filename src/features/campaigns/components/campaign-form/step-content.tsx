"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArticlePicker } from "@/features/templates/components/article-picker";
import { EmailPreview } from "@/features/templates/components/email-preview";
import { buildEmailHtml } from "@/features/templates/lib/html-builder";
import {
  DEFAULT_TEST_DATA,
  DEFAULT_CAMPAIGN_VARS,
} from "@/features/templates/lib/renderer";
import { BannerPicker } from "../banner-picker";
import { ImagePicker } from "../image-picker";
import type { CampaignFormState } from "./campaign-form";
import type {
  TemplateDTO,
  FreeImage,
  CampaignContentMode,
} from "@/features/templates/types";

interface Props {
  state: CampaignFormState;
  templates: TemplateDTO[];
  onChange: (patch: Partial<CampaignFormState>) => void;
}

const CONTENT_MODES: {
  mode: CampaignContentMode;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { mode: "articles", icon: "🛋️", label: "Articles", desc: "Du catalogue" },
  { mode: "images", icon: "📸", label: "Images libres", desc: "Flyers, photos" },
  { mode: "both", icon: "✨", label: "Les deux", desc: "Mixte" },
];

export function StepContent({ state, templates, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === state.templateId) ?? null;

  const showArticles = state.contentMode === "articles" || state.contentMode === "both";
  const showImages = state.contentMode === "images" || state.contentMode === "both";

  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return null;
    return buildEmailHtml({
      campaignType: selectedTemplate.category ?? "Promotion",
      productCategory: selectedTemplate.productCategory ?? null,
      subject: selectedTemplate.subject ?? "",
      content: selectedTemplate.content ?? null,
      conclusion: selectedTemplate.conclusion ?? null,
      bannerImageUrl: state.banner.url || null,
      bannerLinkUrl: state.banner.linkUrl || null,
      contentMode: state.contentMode,
      articles: showArticles ? state.articles : [],
      freeImages: showImages ? state.freeImages : [],
      ctaText: state.ctaText || null,
      ctaUrl: state.ctaUrl || null,
      clientData: DEFAULT_TEST_DATA,
      campaignVars: { ...DEFAULT_CAMPAIGN_VARS, ...state.campaignVars },
    });
  }, [
    selectedTemplate,
    state.banner.url,
    state.banner.linkUrl,
    state.contentMode,
    state.articles,
    state.freeImages,
    state.ctaText,
    state.ctaUrl,
    state.campaignVars,
    showArticles,
    showImages,
  ]);

  const removeArticle = (id: string) =>
    onChange({ articles: state.articles.filter((a) => a.id !== id) });

  const updateArticlePromoPrice = (id: string, promoPrice: number | null) =>
    onChange({
      articles: state.articles.map((a) => (a.id === id ? { ...a, promoPrice } : a)),
    });

  const updateArticleLink = (id: string, linkUrl: string) =>
    onChange({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, linkUrl: linkUrl || null } : a
      ),
    });

  const addImageSlot = () => {
    if (state.freeImages.length >= 4) return;
    const newImage: FreeImage = {
      id: crypto.randomUUID(),
      cloudinaryId: null,
      url: "",
      file: null,
      alt: "",
      caption: null,
      linkUrl: null,
      width: 0,
      height: 0,
      layout: state.freeImages.length === 0 ? "full" : "half",
      isUploaded: false,
    };
    onChange({ freeImages: [...state.freeImages, newImage] });
  };

  const updateFreeImage = (index: number, image: FreeImage) => {
    const images = [...state.freeImages];
    images[index] = image;
    onChange({ freeImages: images });
  };

  const removeFreeImage = (index: number) => {
    const img = state.freeImages[index];
    if (img?.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
    onChange({ freeImages: state.freeImages.filter((_, i) => i !== index) });
  };

  const toggleImageLayout = (index: number) => {
    const img = state.freeImages[index];
    if (!img) return;
    updateFreeImage(index, { ...img, layout: img.layout === "full" ? "half" : "full" });
  };

  return (
    <div className="flex h-full">
      {/* ── Gauche : formulaire ─────────────────────────────────────── */}
      <div className="w-1/2 space-y-5 overflow-y-auto p-6 pr-5">
        <div>
          <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
            Contenu de la campagne
          </h2>
          <p className="text-text-muted text-sm">
            Bannière, articles ou images libres (flyers, photos...)
          </p>
        </div>

        {/* Bannière */}
        <BannerPicker banner={state.banner} onChange={(banner) => onChange({ banner })} />

        {/* Type de contenu */}
        <div className="space-y-2">
          <label className="text-text-primary text-sm font-medium">Type de contenu</label>
          <div className="grid grid-cols-3 gap-2">
            {CONTENT_MODES.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onChange({ contentMode: opt.mode })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                  state.contentMode === opt.mode
                    ? "border-gold-deep bg-gold-light/30"
                    : "border-cream-darker hover:border-gold/40 hover:bg-cream/20"
                )}
              >
                <span className="text-xl">{opt.icon}</span>
                <p className="text-text-primary text-xs font-semibold">{opt.label}</p>
                <p className="text-text-muted text-[10px]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        {showArticles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-text-primary text-sm font-medium">
                Articles à afficher
              </label>
              <span className="text-text-muted text-[11px]">
                {state.articles.length}/4
              </span>
            </div>

            {state.articles.map((article) => (
              <div
                key={article.id}
                className="border-cream-darker space-y-2.5 rounded-lg border bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  {article.mainImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.mainImage}
                      alt={article.name}
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-cream flex size-10 shrink-0 items-center justify-center rounded text-lg">
                      🛋️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate text-sm font-medium">
                      {article.name}
                    </p>
                    <p className="text-text-muted text-xs">
                      {article.price.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArticle(article.id)}
                    className="shrink-0 rounded p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-text-muted text-[10px] font-medium">
                      Prix promo (FCFA)
                    </label>
                    <input
                      type="number"
                      value={article.promoPrice ?? ""}
                      onChange={(e) =>
                        updateArticlePromoPrice(
                          article.id,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="Ex : 89 000"
                      className="border-cream-darker focus:border-gold w-full rounded-md border bg-white px-2 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-muted text-[10px] font-medium">
                      Lien cliquable (optionnel)
                    </label>
                    <input
                      type="url"
                      value={article.linkUrl ?? ""}
                      onChange={(e) => updateArticleLink(article.id, e.target.value)}
                      placeholder="https://..."
                      className="border-cream-darker focus:border-gold w-full rounded-md border bg-white px-2 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            {state.articles.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(true)}
                className="border-cream-darker hover:bg-cream w-full gap-1.5 border-dashed text-xs"
              >
                <Plus className="size-3.5" />
                Ajouter un article du catalogue
              </Button>
            )}

            {state.articles.length === 4 && (
              <p className="text-text-muted text-center text-xs">
                Maximum 4 articles atteint
              </p>
            )}
          </div>
        )}

        {/* Images libres */}
        {showImages && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-text-primary text-sm font-medium">
                Images libres
              </label>
              <span className="text-text-muted text-[11px]">
                {state.freeImages.length}/4
              </span>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-2.5">
              <p className="text-xs text-amber-700">
                Les images seront uploadées vers Cloudinary au moment de la création de la
                campagne.
              </p>
            </div>

            {state.freeImages.map((img, index) => (
              <div
                key={img.id}
                className="border-cream-darker bg-cream/10 rounded-lg border p-3"
              >
                <ImagePicker
                  image={img}
                  onChange={(updated) => updateFreeImage(index, updated)}
                  onRemove={() => removeFreeImage(index)}
                  onLayoutToggle={() => toggleImageLayout(index)}
                />
              </div>
            ))}

            {state.freeImages.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImageSlot}
                className="border-cream-darker hover:bg-cream w-full gap-1.5 border-dashed text-xs"
              >
                <Plus className="size-3.5" />
                Ajouter une image
              </Button>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-2">
          <label className="text-text-primary text-sm font-medium">
            Bouton principal (optionnel)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={state.ctaText}
              onChange={(e) => onChange({ ctaText: e.target.value })}
              placeholder="Voir la collection"
              className="border-cream-darker focus:border-gold rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
            />
            <input
              type="url"
              value={state.ctaUrl}
              onChange={(e) => onChange({ ctaUrl: e.target.value })}
              placeholder="https://mondialhome.sn"
              className="border-cream-darker focus:border-gold rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          {state.ctaText && (
            <div className="pt-1">
              <span
                className="inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#8B6914" }}
              >
                {state.ctaText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Droite : preview live ──────────────────────────────────── */}
      <div className="border-cream-darker w-1/2 border-l">
        <EmailPreview html={previewHtml} subject={selectedTemplate?.subject ?? null} />
      </div>

      <ArticlePicker
        open={showPicker}
        onOpenChange={setShowPicker}
        excludeIds={state.articles.map((a) => a.id)}
        onSelect={(article) => {
          onChange({ articles: [...state.articles, article] });
          setShowPicker(false);
        }}
      />
    </div>
  );
}
