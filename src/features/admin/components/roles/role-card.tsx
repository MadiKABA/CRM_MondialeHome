"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Lock, Shield, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteRoleDialog } from "@/features/admin/components/roles/delete-role-dialog";
import { duplicateRole } from "@/features/admin/server/actions/roles.actions";
import type { RoleListItemDTO } from "@/features/admin/types";

interface RoleCardProps {
  role: RoleListItemDTO;
  isSuperAdmin: boolean;
  allRoles: RoleListItemDTO[];
}

export function RoleCard({ role, isSuperAdmin, allRoles }: RoleCardProps) {
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
      <div className="border-cream-darker bg-background hover:bg-cream/10 flex flex-col rounded-xl border p-5 transition-colors">
        {/* En-tête */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="bg-gold-light/40 flex size-10 shrink-0 items-center justify-center rounded-full">
            {role.isSystem ? (
              <Lock className="text-gold-deep size-4.5" />
            ) : (
              <Shield className="text-gold-deep size-4.5" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {role.isSystem && (
              <Badge className="border-cream-darker text-text-secondary bg-cream text-[10px]">
                Système
              </Badge>
            )}
          </div>
        </div>

        {/* Nom + description */}
        <div className="mb-4 flex-1">
          <h3 className="text-text-primary font-semibold">{role.name}</h3>
          {role.description ? (
            <p className="text-text-secondary mt-1 text-xs leading-relaxed">
              {role.description}
            </p>
          ) : (
            <p className="text-text-secondary mt-1 text-xs italic">Aucune description</p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-4 flex gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="text-gold-deep size-3.5" />
            <span className="text-text-secondary text-xs">
              {role.permissionCount} droit{role.permissionCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="text-text-secondary size-3.5" />
            <span className="text-text-secondary text-xs">
              {role.userCount} membre{role.userCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-gold-light text-gold-deep hover:bg-gold-light/20 w-full text-xs"
            render={<Link href={`/admin/roles/${role.id}`} />}
          >
            Configurer
          </Button>

          {isSuperAdmin && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="border-cream-darker text-text-secondary hover:bg-cream/50 flex-1 gap-1.5 text-xs"
              >
                <Copy className="size-3.5" />
                Dupliquer
              </Button>
              {!role.isSystem && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteOpen(true)}
                  className="flex-1 gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isSuperAdmin && !role.isSystem && (
        <DeleteRoleDialog
          role={role}
          allRoles={allRoles}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
