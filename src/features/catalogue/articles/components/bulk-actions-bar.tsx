"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, CheckCircle, Sparkles, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { bulkArticleAction } from "../server/actions";
import type { BulkArticleActionInput } from "../schemas/article.schema";

// ── Configuration par action ─────────────────────────────────────────────────

type ActionVariant = "danger" | "warning" | "default";

interface ActionConfig {
  title: (count: number) => string;
  description: string;
  confirmWord: string | null;
  requireTyped: boolean;
  variant: ActionVariant;
  label: string;
}

const ACTION_CONFIG: Record<BulkArticleActionInput["action"], ActionConfig> = {
  delete: {
    title: (count) => `Supprimer ${count} article(s) ?`,
    description: "Les articles seront définitivement retirés du catalogue.",
    confirmWord: "SUPPRIMER",
    requireTyped: true,
    variant: "danger",
    label: "Supprimer définitivement",
  },
  archive: {
    title: (count) => `Archiver ${count} article(s) ?`,
    description: "Les articles seront masqués du catalogue mais conservés.",
    confirmWord: "ARCHIVER",
    requireTyped: true,
    variant: "warning",
    label: "Archiver",
  },
  activate: {
    title: (count) => `Rendre ${count} article(s) disponibles ?`,
    description: "Les articles seront visibles dans le catalogue.",
    confirmWord: null,
    requireTyped: false,
    variant: "default",
    label: "Confirmer",
  },
  set_new: {
    title: (count) => `Marquer ${count} article(s) comme nouveauté ?`,
    description: "Les articles afficheront le badge « Nouveauté ».",
    confirmWord: null,
    requireTyped: false,
    variant: "default",
    label: "Confirmer",
  },
  unset_new: {
    title: (count) => `Retirer le badge Nouveauté sur ${count} article(s) ?`,
    description: "Les articles n'afficheront plus le badge « Nouveauté ».",
    confirmWord: null,
    requireTyped: false,
    variant: "default",
    label: "Confirmer",
  },
};

// ── BulkConfirmDialog ─────────────────────────────────────────────────────────

interface BulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BulkArticleActionInput["action"] | null;
  count: number;
  onConfirm: () => Promise<void>;
}

function BulkConfirmDialog({
  open,
  onOpenChange,
  action,
  count,
  onConfirm,
}: BulkConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!action) return null;

  const config = ACTION_CONFIG[action];
  const isConfirmed = config.requireTyped ? typed === config.confirmWord : true;

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
      setTyped("");
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (isLoading) return;
    if (!nextOpen) setTyped("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title(count)}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {config.requireTyped && config.confirmWord && (
          <div className="space-y-2 py-2">
            <Label className="text-muted-foreground text-sm">
              Tapez{" "}
              <code
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-xs",
                  config.variant === "danger" && "bg-destructive/10 text-destructive",
                  config.variant === "warning" && "bg-amber-50 text-amber-700"
                )}
              >
                {config.confirmWord}
              </code>{" "}
              pour confirmer
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              placeholder={config.confirmWord}
              className="font-mono tracking-widest"
              autoFocus
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className={cn(
              "disabled:opacity-50",
              config.variant === "danger" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              config.variant === "warning" &&
                "bg-amber-600 text-white hover:bg-amber-700",
              config.variant === "default" && ""
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                En cours…
              </>
            ) : (
              config.label
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── BulkActionsBar ────────────────────────────────────────────────────────────

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
  const [pendingAction, setPendingAction] = useState<
    BulkArticleActionInput["action"] | null
  >(null);

  if (selectedIds.length === 0) return null;

  const LABELS: Record<BulkArticleActionInput["action"], string> = {
    archive: "archivé(s)",
    activate: "activé(s)",
    delete: "supprimé(s)",
    set_new: "marqué(s) nouveauté",
    unset_new: "retiré(s) des nouveautés",
  };

  const executeAction = async (action: BulkArticleActionInput["action"]) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await bulkArticleAction({ articleIds: selectedIds, action });
        if (result.success) {
          toast.success(
            `${result.data?.affected ?? selectedIds.length} article(s) ${LABELS[action]}`
          );
          onClearSelection();
        } else {
          toast.error(result.error);
        }
        resolve();
      });
    });
  };

  const handleAction = (action: BulkArticleActionInput["action"]) => {
    setPendingAction(action);
  };

  return (
    <>
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
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
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

      <BulkConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        action={pendingAction}
        count={selectedIds.length}
        onConfirm={async () => {
          if (pendingAction) await executeAction(pendingAction);
        }}
      />
    </>
  );
}
