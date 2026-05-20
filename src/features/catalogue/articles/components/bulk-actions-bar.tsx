"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Archive, CheckCircle, Sparkles, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkArticleAction } from "../server/actions";
import type { BulkArticleActionInput } from "../schemas/article.schema";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  canDelete: boolean;
}

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
  canDelete,
}: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  const handleAction = (action: BulkArticleActionInput["action"]) => {
    startTransition(async () => {
      const result = await bulkArticleAction({ articleIds: selectedIds, action });
      if (result.success) {
        const labels: Record<BulkArticleActionInput["action"], string> = {
          archive: "archivé(s)",
          activate: "activé(s)",
          delete: "supprimé(s)",
          set_new: "marqué(s) nouveauté",
          unset_new: "retiré(s) des nouveautés",
        };
        toast.success(
          `${result.data?.affected ?? selectedIds.length} article(s) ${labels[action]}`
        );
        onClearSelection();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="bg-card border-cream-darker flex items-center gap-2 rounded-lg border px-4 py-2 shadow-sm">
      <span className="text-muted-foreground mr-2 text-sm">
        <strong>{selectedIds.length}</strong> sélectionné(s)
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("activate")}
        disabled={isPending}
        className="gap-1.5"
      >
        <CheckCircle className="size-3.5" />
        Activer
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("archive")}
        disabled={isPending}
        className="gap-1.5"
      >
        <Archive className="size-3.5" />
        Archiver
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("set_new")}
        disabled={isPending}
        className="gap-1.5"
      >
        <Sparkles className="size-3.5" />
        Nouveauté
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("unset_new")}
        disabled={isPending}
        className="gap-1.5"
      >
        <X className="size-3.5" />
        Retirer nouveauté
      </Button>

      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("delete")}
          disabled={isPending}
          className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={isPending}
        className="ml-auto"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
