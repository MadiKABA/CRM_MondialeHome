"use client";

import { useState } from "react";
import { Monitor, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmailPreviewProps {
  html: string | null;
  isLoading?: boolean;
  subject?: string | null;
}

export function EmailPreview({ html, isLoading = false, subject }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="flex h-full flex-col">
      {/* Barre outils */}
      <div className="border-cream-darker bg-cream/30 flex items-center justify-between border-b px-3 py-2">
        <span className="text-text-secondary text-xs font-medium">Prévisualisation</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("desktop")}
            className={cn(
              "h-7 w-7 p-0",
              viewMode === "desktop"
                ? "bg-gold-light/50 text-gold-darker"
                : "text-text-muted hover:text-text-secondary hover:bg-cream"
            )}
            title="Vue desktop"
          >
            <Monitor className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("mobile")}
            className={cn(
              "h-7 w-7 p-0",
              viewMode === "mobile"
                ? "bg-gold-light/50 text-gold-darker"
                : "text-text-muted hover:text-text-secondary hover:bg-cream"
            )}
            title="Vue mobile"
          >
            <Smartphone className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Simulation boîte mail */}
      {subject && (
        <div className="border-cream-darker border-b bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-gold-deep/20 flex size-6 shrink-0 items-center justify-center rounded-full">
              <span className="text-gold-darker text-[10px] font-bold">MH</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-text-primary truncate text-[11px] font-semibold">
                Mondial Home CRM
              </p>
              <p className="text-text-muted truncate text-[11px]">{subject}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rendu HTML */}
      <div className="flex-1 overflow-auto bg-gray-100 p-3">
        {isLoading ? (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="text-gold-deep mx-auto mb-2 size-6 animate-spin" />
              <p className="text-text-muted text-xs">Génération...</p>
            </div>
          </div>
        ) : !html ? (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-text-muted text-sm">Remplissez le formulaire</p>
              <p className="text-text-muted mt-1 text-xs">
                La prévisualisation apparaît ici
              </p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "mx-auto transition-all duration-300",
              viewMode === "desktop" ? "max-w-[600px]" : "max-w-[375px]"
            )}
          >
            <div className="overflow-hidden rounded-lg bg-white shadow-md">
              <iframe
                srcDoc={html}
                title="Prévisualisation email"
                className="w-full border-0"
                style={{ minHeight: "500px", height: "auto" }}
                onLoad={(e) => {
                  const iframe = e.currentTarget;
                  try {
                    const contentHeight = iframe.contentDocument?.body.scrollHeight;
                    if (contentHeight) iframe.style.height = contentHeight + "px";
                  } catch {
                    iframe.style.height = "600px";
                  }
                }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
