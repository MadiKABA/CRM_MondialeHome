"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteSegment } from "@/features/segments/server/actions";

interface DeleteSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentId: string;
  segmentName: string;
  onDeleted?: () => void;
}

export function DeleteSegmentDialog({
  open,
  onOpenChange,
  segmentId,
  segmentName,
  onDeleted,
}: DeleteSegmentDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSegment({ id: segmentId, confirmation });
      if (result.success) {
        toast.success(`"${segmentName}" a été supprimé`);
        onOpenChange(false);
        setConfirmation("");
        onDeleted?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) {
          setConfirmation("");
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer ce segment ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Tous les membres du segment seront retirés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-text-secondary text-sm">
            Segment à supprimer :{" "}
            <span className="text-text-primary font-semibold">{segmentName}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete" className="text-sm">
              Tapez{" "}
              <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                SUPPRIMER
              </span>{" "}
              pour confirmer
            </Label>
            <Input
              id="confirm-delete"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              className="font-mono"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmation !== "SUPPRIMER" || isPending}
          >
            {isPending ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
