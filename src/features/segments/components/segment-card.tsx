"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Eye, RefreshCw, Users2, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { refreshSegment } from "@/features/segments/server/actions";
import { DeleteSegmentDialog } from "./delete-segment-dialog";
import { AddMembersDialog } from "./add-members-dialog";
import type { SegmentDTO } from "../types";
import { CRITERIA_DEFINITIONS } from "../types";
import { cn } from "@/lib/utils";

interface SegmentCardProps {
  segment: SegmentDTO;
  canManageMembers: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

function formatLastRefreshed(date: Date | null): {
  label: string;
  status: "ok" | "warn" | "stale";
} {
  if (!date) return { label: "Jamais actualisé", status: "stale" };
  const diffMs = Date.now() - new Date(date).getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return { label: "Actualisé il y a moins d'1h", status: "ok" };
  if (diffH < 24) {
    const h = Math.round(diffH);
    return { label: `Actualisé il y a ${h}h`, status: "ok" };
  }
  if (diffH < 48) return { label: "Actualisé hier", status: "warn" };
  const d = Math.round(diffH / 24);
  return { label: `Actualisé il y a ${d} jours`, status: "stale" };
}

function CriteriaPreview({
  criteria,
}: {
  criteria: NonNullable<SegmentDTO["criteria"]>;
}) {
  if (!criteria.criteria || criteria.criteria.length === 0) return null;

  return (
    <div className="mt-2 space-y-0.5">
      {criteria.criteria.slice(0, 2).map((c, i) => {
        const def = CRITERIA_DEFINITIONS.find((d) => d.field === c.field);
        const op = def?.operators.find((o) => o.value === c.operator);
        return (
          <p key={i} className="text-text-secondary text-xs">
            {def?.label ?? c.field}{" "}
            <span className="text-text-muted">{op?.label ?? c.operator}</span>{" "}
            <span className="font-medium">
              {c.value as string} {def?.unit ?? ""}
            </span>
          </p>
        );
      })}
      {criteria.criteria.length > 2 && (
        <p className="text-text-muted text-xs">
          +{criteria.criteria.length - 2} autre
          {criteria.criteria.length - 2 > 1 ? "s" : ""} critère
          {criteria.criteria.length - 2 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function SegmentCard({
  segment,
  canManageMembers,
  canUpdate,
  canDelete,
}: SegmentCardProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);

  const { label: refreshLabel, status: refreshStatus } = formatLastRefreshed(
    segment.lastRefreshedAt
  );

  function handleRefresh() {
    startRefresh(async () => {
      const result = await refreshSegment(segment.id);
      if (result.success && result.data) {
        toast.success(
          `Segment actualisé — ${result.data.memberCount.toLocaleString("fr-FR")} clients`
        );
      } else {
        toast.error(result.success === false ? result.error : "Erreur inattendue");
      }
    });
  }

  return (
    <>
      <div className="border-cream-darker bg-background hover:bg-cream/10 flex flex-col rounded-xl border p-5 transition-colors">
        {/* En-tête : icône + nom + badge */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${segment.color}22` }}
            >
              {segment.icon ?? (segment.type === "STATIC" ? "👥" : "⚡")}
            </div>
            <div>
              <h3 className="text-text-primary leading-tight font-semibold">
                {segment.name}
              </h3>
              {segment.description && (
                <p className="text-text-secondary mt-0.5 text-xs leading-relaxed">
                  {segment.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {segment.isSystem && (
              <Badge className="border-cream-darker text-text-secondary bg-cream text-[10px]">
                Système
              </Badge>
            )}
          </div>
        </div>

        {/* Critères (segment dynamique) */}
        {segment.type === "DYNAMIC" && segment.criteria && (
          <CriteriaPreview criteria={segment.criteria} />
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users2 className="text-gold-deep size-4" />
            <span className="text-text-primary text-sm font-semibold">
              {segment.memberCount.toLocaleString("fr-FR")}
            </span>
            <span className="text-text-secondary text-xs">clients</span>
          </div>

          {segment.type === "DYNAMIC" && (
            <span
              className={cn("text-xs", {
                "text-emerald-600 dark:text-emerald-400": refreshStatus === "ok",
                "text-amber-600 dark:text-amber-400": refreshStatus === "warn",
                "text-red-600 dark:text-red-400": refreshStatus === "stale",
              })}
            >
              {refreshLabel}
            </span>
          )}
          {segment.type === "STATIC" && (
            <span className="text-text-secondary text-xs">Groupe manuel</span>
          )}
        </div>

        {/* Actions */}
        <div className="border-cream-darker mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker text-text-secondary hover:bg-cream flex-1 gap-1.5 text-xs"
            render={<Link href={`/segments/${segment.id}`} />}
          >
            <Eye className="size-3.5" />
            Voir
          </Button>

          {segment.type === "STATIC" && canManageMembers && (
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker text-text-secondary hover:bg-cream flex-1 gap-1.5 text-xs"
              onClick={() => setAddMembersOpen(true)}
            >
              <UserPlus className="size-3.5" />
              Ajouter
            </Button>
          )}

          {segment.type === "DYNAMIC" && canUpdate && (
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker text-text-secondary hover:bg-cream flex-1 gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              {isRefreshing ? "..." : "Actualiser"}
            </Button>
          )}

          {!segment.isSystem && canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <DeleteSegmentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        segmentId={segment.id}
        segmentName={segment.name}
        memberCount={segment.memberCount}
        onDeleted={() => router.refresh()}
      />

      {segment.type === "STATIC" && (
        <AddMembersDialog
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
          groupId={segment.id}
          groupName={segment.name}
        />
      )}
    </>
  );
}
