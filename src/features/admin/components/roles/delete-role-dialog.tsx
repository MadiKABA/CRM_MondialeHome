"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteRole } from "@/features/admin/server/actions/roles.actions";
import type { RoleListItemDTO } from "@/features/admin/types";

interface DeleteRoleDialogProps {
  role: RoleListItemDTO;
  allRoles: RoleListItemDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRoleDialog({
  role,
  allRoles,
  open,
  onOpenChange,
}: DeleteRoleDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [replacementRoleId, setReplacementRoleId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const replacementRoles = allRoles.filter((r) => r.id !== role.id);
  const needsReplacement = role.userCount > 0;
  const canConfirm =
    confirmation === "SUPPRIMER" && (!needsReplacement || replacementRoleId !== "");

  function handleClose(val: boolean) {
    if (!isPending) {
      setConfirmation("");
      setReplacementRoleId("");
      onOpenChange(val);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRole({
        roleId: role.id,
        replacementRoleId: replacementRoleId || undefined,
        confirmation: "SUPPRIMER",
      });

      if (result.success) {
        toast.success(`Profil "${role.name}" supprimé.`);
        onOpenChange(false);
        router.push("/admin/roles");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="size-4 text-red-600" />
            </div>
            <DialogTitle>Supprimer le profil</DialogTitle>
          </div>
          <DialogDescription>
            Vous allez supprimer le profil{" "}
            <span className="font-medium text-red-600">{role.name}</span>. Cette action
            est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {needsReplacement && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">{role.userCount} membre(s)</span> ont ce
                  profil. Choisissez un profil de remplacement avant de continuer.
                </p>
              </div>
            </div>
          )}

          {needsReplacement && (
            <div className="space-y-1.5">
              <Label htmlFor="dr-replacement">Profil de remplacement *</Label>
              <select
                id="dr-replacement"
                value={replacementRoleId}
                onChange={(e) => setReplacementRoleId(e.target.value)}
                className="border-cream-darker text-text-primary bg-background focus:ring-gold-deep w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                <option value="">— Choisir un profil —</option>
                {replacementRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dr-confirm">
              Tapez <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer
            </Label>
            <Input
              id="dr-confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              render={<button type="button" />}
              disabled={isPending}
              className="border-cream-darker text-text-secondary hover:bg-cream/50 rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              Annuler
            </DialogClose>
            <Button
              onClick={handleDelete}
              disabled={!canConfirm || isPending}
              className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
