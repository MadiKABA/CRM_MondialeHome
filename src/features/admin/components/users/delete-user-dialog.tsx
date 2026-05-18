"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TriangleAlert, Loader2 } from "lucide-react";
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
import { deleteUser } from "@/features/admin/server/actions/users.actions";
import type { UserListItemDTO } from "@/features/admin/types";

interface DeleteUserDialogProps {
  user: UserListItemDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONFIRMATION_WORD = "SUPPRIMER";

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  const isConfirmed = confirmation === CONFIRMATION_WORD;

  function handleSubmit() {
    if (!isConfirmed) return;

    startTransition(async () => {
      const result = await deleteUser({ userId: user.id, confirmation });

      if (result.success) {
        toast.success(`${user.name} a été supprimé(e).`);
        setConfirmation("");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClose() {
    if (isPending) return;
    setConfirmation("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <TriangleAlert className="size-5" />
            Supprimer {user.name} ?
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">Cette action est irréversible.</span>
            <span className="block">
              La personne perdra tous ses accès et ses sessions actives seront fermées
              immédiatement.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="delete-confirmation">
            Tapez{" "}
            <span className="font-mono font-bold text-red-600">{CONFIRMATION_WORD}</span>{" "}
            pour confirmer
          </Label>
          <Input
            id="delete-confirmation"
            placeholder={CONFIRMATION_WORD}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={isPending}
            className={
              confirmation.length > 0 && !isConfirmed
                ? "border-red-300 focus-visible:ring-red-300"
                : ""
            }
            autoComplete="off"
          />
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
            disabled={isPending || !isConfirmed}
            className="bg-red-600 text-white hover:bg-red-700"
            aria-label={`Supprimer définitivement ${user.name}`}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
