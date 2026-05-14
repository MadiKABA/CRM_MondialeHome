"use client";

import Link from "next/link";
import { Shield, Lock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoleListItemDTO } from "@/features/admin/types";

interface UserRolesSectionProps {
  userId?: string;
  roles: RoleListItemDTO[];
  isSuperAdmin: boolean;
}

export function UserRolesSection({ roles, isSuperAdmin }: UserRolesSectionProps) {
  return (
    <div className="border-cream-darker rounded-xl border p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-text-primary flex items-center gap-2 font-semibold">
            <Shield className="text-gold-deep size-4" />
            {"Profils d'accès"}
          </h3>
          <p className="text-text-secondary mt-0.5 text-xs">
            Les profils définissent ce que cette personne peut faire dans le CRM
          </p>
        </div>
        {!isSuperAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="border-gold-light text-gold-deep hover:bg-gold-light/20 shrink-0 gap-1.5 text-xs"
          >
            + Ajouter un profil
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs text-amber-800">
            <Lock className="size-3.5 shrink-0" />
            Super Administrateur — accès illimité à toute l&apos;application, quel que
            soit les profils assignés
          </p>
        </div>
      )}

      {roles.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-text-secondary text-sm italic">Aucun profil assigné</p>
          <p className="text-text-secondary mt-1 text-xs">
            Cette personne n&apos;a accès à aucune fonctionnalité du CRM.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className="border-cream-darker bg-cream/30 flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-gold-light/50 flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Shield className="text-gold-deep size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary text-sm font-medium">
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <Badge className="border-cream-darker text-text-secondary bg-cream text-[10px]">
                        Système
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-text-secondary truncate text-xs">
                      {role.description}
                    </p>
                  )}
                  <p className="text-text-secondary mt-0.5 text-xs">
                    {role.permissionCount} droit{role.permissionCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-text-secondary hover:text-text-primary text-xs"
                  render={<Link href={`/admin/roles/${role.id}`} />}
                >
                  Voir
                </Button>
                {!isSuperAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    title="Retirer ce profil"
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Retirer ce profil</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
