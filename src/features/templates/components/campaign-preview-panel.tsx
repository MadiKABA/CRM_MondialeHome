"use client";

import { useState } from "react";
import { Eye, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticlePicker } from "./article-picker";
import { BannerUpload } from "./banner-upload";
import type { CampaignArticle } from "../types";

export interface CampaignPreviewData {
  articles: CampaignArticle[];
  ctaText: string;
  ctaUrl: string;
  bannerImageUrl: string;
}

interface CampaignPreviewPanelProps {
  campaignData: CampaignPreviewData;
  onChange: (data: CampaignPreviewData) => void;
}

export function CampaignPreviewPanel({
  campaignData,
  onChange,
}: CampaignPreviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showArticlePicker, setShowArticlePicker] = useState(false);

  const updateField = (field: keyof CampaignPreviewData, value: unknown) => {
    onChange({ ...campaignData, [field]: value });
  };

  const removeArticle = (id: string) => {
    onChange({
      ...campaignData,
      articles: campaignData.articles.filter((a) => a.id !== id),
    });
  };

  const updateArticlePromoPrice = (id: string, promoPrice: number | null) => {
    onChange({
      ...campaignData,
      articles: campaignData.articles.map((a) =>
        a.id === id ? { ...a, promoPrice } : a
      ),
    });
  };

  const updateArticleLink = (id: string, linkUrl: string) => {
    onChange({
      ...campaignData,
      articles: campaignData.articles.map((a) =>
        a.id === id ? { ...a, linkUrl: linkUrl || null } : a
      ),
    });
  };

  const hasData = campaignData.articles.length > 0 || !!campaignData.ctaText;

  return (
    <div className="border-gold/30 bg-gold-light/10 overflow-hidden rounded-xl border">
      {/* Header accordéon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-gold-light/20 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye className="text-gold-deep size-4" />
          <span className="text-gold-deeper text-sm font-semibold">
            Simuler une campagne pour la preview
          </span>
          {hasData && (
            <span className="bg-gold-deep rounded-full px-2 py-0.5 text-[10px] text-white">
              {campaignData.articles.length} article(s)
              {campaignData.ctaText ? " + CTA" : ""}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="text-gold-deep size-4 shrink-0" />
        ) : (
          <ChevronRight className="text-gold-deep size-4 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="border-gold/20 space-y-4 border-t px-4 pb-4">
          <p className="text-text-muted mt-3 text-xs">
            Ces données ne sont pas sauvegardées dans le template. Elles servent
            uniquement à visualiser le rendu. Lors d&apos;une vraie campagne, vous les
            saisirez dans l&apos;éditeur de campagne.
          </p>

          {/* Bannière */}
          <BannerUpload
            value={campaignData.bannerImageUrl}
            onChange={(url) => updateField("bannerImageUrl", url)}
          />

          {/* Articles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-text-primary text-xs font-medium">
                Articles à afficher (max 4)
              </label>
              <span className="text-text-muted text-[10px]">
                {campaignData.articles.length}/4
              </span>
            </div>

            {campaignData.articles.map((article) => (
              <div
                key={article.id}
                className="border-cream-darker space-y-2 rounded-lg border bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {article.mainImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.mainImage}
                        alt={article.name}
                        className="size-8 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-text-primary truncate text-xs font-medium">
                        {article.name}
                      </p>
                      <p className="text-text-muted text-[10px]">
                        {article.price.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArticle(article.id)}
                    className="shrink-0 rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-text-muted text-[10px]">
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
                      placeholder="Ex : 360000"
                      className="border-cream-darker focus:border-gold w-full rounded-md border bg-white px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-muted text-[10px]">Lien cliquable</label>
                    <input
                      type="url"
                      value={article.linkUrl ?? ""}
                      onChange={(e) => updateArticleLink(article.id, e.target.value)}
                      placeholder="https://..."
                      className="border-cream-darker focus:border-gold w-full rounded-md border bg-white px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            {campaignData.articles.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowArticlePicker(true)}
                className="border-cream-darker hover:bg-cream w-full gap-1.5 border-dashed text-xs"
              >
                <Plus className="size-3.5" />
                Ajouter un article du catalogue
              </Button>
            )}
          </div>

          {/* Bouton CTA */}
          <div className="space-y-2">
            <label className="text-text-primary text-xs font-medium">
              Bouton principal
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={campaignData.ctaText}
                onChange={(e) => updateField("ctaText", e.target.value)}
                placeholder="Voir la collection"
                className="border-cream-darker focus:border-gold rounded-lg border bg-white px-3 py-2 text-xs focus:outline-none"
              />
              <input
                type="url"
                value={campaignData.ctaUrl}
                onChange={(e) => updateField("ctaUrl", e.target.value)}
                placeholder="https://mondialhome.sn"
                className="border-cream-darker focus:border-gold rounded-lg border bg-white px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            {campaignData.ctaText && (
              <div className="pt-1 text-center">
                <span
                  className="inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#8B6914" }}
                >
                  {campaignData.ctaText}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <ArticlePicker
        open={showArticlePicker}
        onOpenChange={setShowArticlePicker}
        excludeIds={campaignData.articles.map((a) => a.id)}
        onSelect={(article) => {
          onChange({ ...campaignData, articles: [...campaignData.articles, article] });
          setShowArticlePicker(false);
        }}
      />
    </div>
  );
}
