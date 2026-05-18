"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toggleUserStatus } from "@/features/admin/server/actions/users.actions";
import type { UserListItemDTO } from "@/features/admin/types";

interface ToggleStatusDialogProps {
  user: UserListItemDTO;
  targetActive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleStatusDialog({
  user,
  targetActive,
  open,
  onOpenChange,
}: ToggleStatusDialogProps) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDeactivating = !targetActive;
  const actionLabel = isDeactivating ? "Désactiver" : "Réactiver";

  function handleSubmit() {
    if (!reason.trim()) return;

    startTransition(async () => {
      const result = await toggleUserStatus({
        userId: user.id,
        isActive: targetActive,
        reason: reason.trim(),
      });

      if (result.success) {
        toast.success(
          isDeactivating
            ? `${user.name} a été désactivé(e).`
            : `${user.name} a été réactivé(e).`
        );
        setReason("");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClose() {
    if (isPending) return;
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeactivating ? (
              <UserX className="size-5 text-amber-600" />
            ) : (
              <UserCheck className="text-gold size-5" />
            )}
            {actionLabel} {user.name} ?
          </DialogTitle>
          <DialogDescription>
            {isDeactivating
              ? "Cette personne ne pourra plus se connecter au CRM. Ses données sont conservées."
              : "Cette personne pourra à nouveau se connecter au CRM avec ses accès habituels."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="toggle-reason">
            Motif <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="toggle-reason"
            placeholder={
              isDeactivating
                ? "Ex : Départ de l'entreprise, congé longue durée…"
                : "Ex : Retour de congé, réintégration…"
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isPending}
          />
          {reason.trim() === "" && (
            <p className="text-muted-foreground text-xs">Le motif est obligatoire.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="border-cream-darker text-text-secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || reason.trim() === ""}
            className={
              isDeactivating
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-gold hover:bg-gold-darker text-white"
            }
            aria-label={`${actionLabel} ${user.name}`}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
