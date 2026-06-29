"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RFM_PROFILE_CONFIGS, type RFMProfile } from "@/features/rfm/types";
import { recalculateSingleClientRFM } from "@/features/rfm/server/actions";

// ── Badge profil RFM ──────────────────────────────────────────────────────────

interface RFMBadgeProps {
  profile: string | null | undefined;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function RFMBadge({ profile, showIcon = true, size = "md" }: RFMBadgeProps) {
  if (!profile) {
    return (
      <span className="border-border bg-muted text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
        Non calculé
      </span>
    );
  }

  const config = RFM_PROFILE_CONFIGS[profile as RFMProfile];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.color,
        config.textColor,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

// ── Affichage détaillé R/F/M ──────────────────────────────────────────────────

interface RFMScoreDetailProps {
  r: number | null;
  f: number | null;
  m: number | null;
  calculatedAt: Date | null;
}

export function RFMScoreDetail({ r, f, m, calculatedAt }: RFMScoreDetailProps) {
  if (r === null && f === null && m === null) return null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { label: "Récence (R)", value: r },
            { label: "Fréquence (F)", value: f },
            { label: "Montant (M)", value: m },
          ] as const
        ).map(({ label, value }) => (
          <div
            key={label}
            className="border-border bg-muted/50 rounded-lg border p-2 text-center"
          >
            <div className="mb-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "size-2 rounded-full",
                    value !== null && i <= value ? "bg-amber-500" : "bg-border"
                  )}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-[10px]">{label}</p>
            <p className="text-foreground text-xs font-bold">{value ?? "—"}/5</p>
          </div>
        ))}
      </div>
      {calculatedAt && (
        <p className="text-muted-foreground text-center text-[10px]">
          Calculé le{" "}
          {new Date(calculatedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

// ── Bouton recalcul manuel ────────────────────────────────────────────────────

interface RecalculateRFMButtonProps {
  clientId: string;
  onSuccess?: (profile: string) => void;
}

export function RecalculateRFMButton({ clientId, onSuccess }: RecalculateRFMButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await recalculateSingleClientRFM(clientId);
      if (result.success && result.data) {
        toast.success("Score RFM mis à jour");
        onSuccess?.(result.data.profile);
      } else if (!result.success) {
        toast.error(result.error ?? "Erreur lors du recalcul");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-7 w-full text-xs"
      onClick={handleClick}
      disabled={isPending}
    >
      <RefreshCw className={cn("mr-1.5 size-3", isPending && "animate-spin")} />
      {isPending ? "Calcul en cours..." : "Recalculer"}
    </Button>
  );
}
