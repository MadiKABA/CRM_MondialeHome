"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteRoleDialog } from "@/features/admin/components/roles/delete-role-dialog";
import { duplicateRole } from "@/features/admin/server/actions/roles.actions";
import type { RoleDTO, RoleListItemDTO } from "@/features/admin/types";

interface RoleDetailActionsProps {
  role: RoleDTO;
  allRoles: RoleListItemDTO[];
}

export function RoleDetailActions({ role, allRoles }: RoleDetailActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDuplicating, startDuplicate] = useTransition();
  const router = useRouter();

  function handleDuplicate() {
    startDuplicate(async () => {
      const result = await duplicateRole(role.id);
      if (result.success) {
        toast.success(`Copie de "${role.name}" créée.`);
        router.push(`/admin/roles/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="border-cream-darker text-text-secondary gap-1.5 text-xs"
        >
          <Copy className="size-3.5" />
          Dupliquer
        </Button>
        {!role.isSystem && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Supprimer
          </Button>
        )}
      </div>

      {!role.isSystem && (
        <DeleteRoleDialog
          role={{
            id: role.id,
            name: role.name,
            slug: role.slug,
            description: role.description,
            isSystem: role.isSystem,
            priority: role.priority,
            permissionCount: role.permissionCount,
            userCount: role.userCount,
          }}
          allRoles={allRoles}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
