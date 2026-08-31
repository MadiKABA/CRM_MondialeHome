"use client";

import {
  Users,
  Mail,
  Eye,
  MousePointerClick,
  Copy,
  Ban,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { EDITABLE_STATUSES, DELETABLE_STATUSES } from "../types";
import type { CampaignDTO } from "../types";

interface Props {
  campaign: CampaignDTO;
  permissions: {
    canUpdate: boolean;
    canCreate: boolean;
    canCancel: boolean;
    canDelete: boolean;
  };
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRetry: () => void;
  isDuplicating?: boolean;
  isRetrying?: boolean;
}

export function CampaignCard({
  campaign: c,
  permissions,
  onView,
  onEdit,
  onCancel,
  onDuplicate,
  onDelete,
  onRetry,
  isDuplicating,
  isRetrying,
}: Props) {
  const canCancel =
    permissions.canCancel && ["SCHEDULED", "SENDING", "PAUSED"].includes(c.status);
  const canEdit = permissions.canUpdate && EDITABLE_STATUSES.includes(c.status);
  const canDuplicate = permissions.canCreate && c.status !== "SENDING";
  const canRetry = permissions.canUpdate && c.status === "FAILED";
  const canDeleteThis = permissions.canDelete && DELETABLE_STATUSES.includes(c.status);
  const hasAnyAction = canEdit || canDuplicate || canCancel || canRetry || canDeleteThis;

  return (
    <div
      onClick={onView}
      className="border-cream-darker hover:border-gold/30 cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Infos principales */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-text-primary text-sm font-semibold">{c.name}</h3>
            <CampaignStatusBadge status={c.status} size="sm" />
          </div>

          <div className="text-text-muted flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {c.segmentName} ({c.segmentCount} clients)
            </span>
            {c.templateName && (
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {c.templateName}
              </span>
            )}
            {c.scheduledAt && c.status === "SCHEDULED" && (
              <span className="flex items-center gap-1 text-blue-600">
                <Calendar className="size-3.5" />
                {new Date(c.scheduledAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Stats rapides */}
        {(c.status === "SENT" || c.status === "SENDING" || c.status === "COMPLETED") && (
          <div className="flex shrink-0 items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-text-primary font-bold">{c.sentCount}</p>
              <p className="text-text-muted">Envoyés</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary flex items-center gap-1 font-bold">
                <Eye className="size-3" />
                {c.openRate}%
              </p>
              <p className="text-text-muted">Ouverts</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary flex items-center gap-1 font-bold">
                <MousePointerClick className="size-3" />
                {c.clickRate}%
              </p>
              <p className="text-text-muted">Cliqués</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {hasAnyAction && (
          <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="text-text-secondary hover:bg-cream flex h-8 w-8 items-center justify-center rounded-md"
                title="Actions"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Pencil className="size-3.5" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {canDuplicate && (
                  <DropdownMenuItem
                    onClick={onDuplicate}
                    disabled={isDuplicating}
                    className="gap-2"
                  >
                    {isDuplicating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Dupliquer
                  </DropdownMenuItem>
                )}
                {canRetry && (
                  <DropdownMenuItem
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="gap-2"
                  >
                    {isRetrying ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    Relancer
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem
                    onClick={onCancel}
                    className="gap-2 text-red-500 focus:text-red-700"
                  >
                    <Ban className="size-3.5" />
                    Annuler
                  </DropdownMenuItem>
                )}
                {canDeleteThis && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="gap-2 text-red-500 focus:text-red-700"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Barre de progression si en cours */}
      {c.status === "SENDING" && c.totalCount > 0 && (
        <div className="mt-3">
          <div className="bg-cream-darker h-1.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.round((c.sentCount / c.totalCount) * 100)}%` }}
            />
          </div>
          <p className="text-text-muted mt-1 text-[10px]">
            {c.sentCount} / {c.totalCount} envoyés
          </p>
        </div>
      )}
    </div>
  );
}
