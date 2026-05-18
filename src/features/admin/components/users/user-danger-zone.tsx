"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleStatusDialog } from "@/features/admin/components/users/toggle-status-dialog";
import { DeleteUserDialog } from "@/features/admin/components/users/delete-user-dialog";
interface UserDangerZoneProps {
  user: { id: string; name: string; isActive: boolean };
}

export function UserDangerZone({ user }: UserDangerZoneProps) {
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-red-200 p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertTriangle className="size-4" />
          Zone de danger
        </h3>
        <p className="text-text-secondary mb-4 text-xs">
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => setToggleOpen(true)}
          >
            {user.isActive ? "Désactiver le compte" : "Réactiver le compte"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            Supprimer définitivement
          </Button>
        </div>
      </div>

      <ToggleStatusDialog
        user={user}
        targetActive={!user.isActive}
        open={toggleOpen}
        onOpenChange={setToggleOpen}
      />
      <DeleteUserDialog user={user} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
