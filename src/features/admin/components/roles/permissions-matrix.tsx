"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MODULES, MODULE_ORDER, PERMISSIONS_BY_MODULE } from "@/lib/permissions";
import { getPermissionLabel } from "@/features/admin/lib/permission-labels";
import { DANGEROUS_PERMISSIONS } from "@/lib/permissions";
import { setRolePermissions } from "@/features/admin/server/actions/roles.actions";
import { Button } from "@/components/ui/button";
import type { PermissionCode } from "@/lib/permissions";

interface PermissionsMatrixProps {
  roleId: string;
  isSystem: boolean;
  grantedCodes: string[];
}

export function PermissionsMatrix({
  roleId,
  isSystem,
  grantedCodes,
}: PermissionsMatrixProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(grantedCodes));
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["clients"]));
  const [isPending, startTransition] = useTransition();

  const isDirty =
    grantedCodes.some((c) => !selected.has(c)) ||
    [...selected].some((c) => !grantedCodes.includes(c));

  function toggleModule(moduleCode: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(moduleCode) ? next.delete(moduleCode) : next.add(moduleCode);
      return next;
    });
  }

  function togglePermission(code: string) {
    if (isSystem) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function toggleModulePermissions(moduleCode: string, allCodes: PermissionCode[]) {
    if (isSystem) return;
    const allGranted = allCodes.every((c) => selected.has(c));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allGranted) {
        allCodes.forEach((c) => next.delete(c));
      } else {
        allCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setRolePermissions({
        roleId,
        permissionCodes: [...selected],
      });
      if (result.success) {
        toast.success("Droits mis à jour.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="border-cream-darker rounded-xl border">
      {/* En-tête */}
      <div className="border-cream-darker flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="text-text-primary font-semibold">Droits du profil</h3>
          <p className="text-text-secondary mt-0.5 text-xs">
            {selected.size} droit{selected.size > 1 ? "s" : ""} accordé
            {selected.size > 1 ? "s" : ""}
            {isSystem && " — profil système (lecture seule)"}
          </p>
        </div>
        {!isSystem && (
          <Button
            onClick={handleSave}
            disabled={!isDirty || isPending}
            size="sm"
            className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        )}
      </div>

      {/* Matrice */}
      <div className="divide-cream-darker divide-y p-4">
        {MODULE_ORDER.map((moduleCode) => {
          const mod = MODULES[moduleCode];
          const modPermissions = PERMISSIONS_BY_MODULE[moduleCode] ?? [];
          const grantedCount = modPermissions.filter((p) => selected.has(p)).length;
          const isOpen = openModules.has(moduleCode);
          const allGranted = grantedCount === modPermissions.length;

          return (
            <div key={moduleCode} className="overflow-hidden rounded-lg">
              {/* En-tête module */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleModule(moduleCode)}
                  className="hover:bg-cream/50 flex flex-1 items-center gap-3 px-3 py-3 text-left transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="text-text-secondary size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="text-text-secondary size-4 shrink-0" />
                  )}
                  <span className="text-text-primary flex-1 text-sm font-medium">
                    {mod.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      allGranted
                        ? "bg-gold-light/50 text-gold-deep"
                        : grantedCount > 0
                          ? "bg-cream text-text-secondary"
                          : "bg-cream text-text-secondary opacity-50"
                    )}
                  >
                    {grantedCount}/{modPermissions.length}
                  </span>
                </button>
                {!isSystem && (
                  <button
                    type="button"
                    onClick={() => toggleModulePermissions(moduleCode, modPermissions)}
                    className="text-gold-deep hover:text-gold-deep/70 shrink-0 px-3 py-3 text-xs font-medium transition-colors"
                    title={allGranted ? "Tout retirer" : "Tout accorder"}
                  >
                    {allGranted ? "Tout retirer" : "Tout accorder"}
                  </button>
                )}
              </div>

              {/* Permissions du module */}
              {isOpen && (
                <div className="border-cream-darker divide-cream-darker ml-4 divide-y border-l">
                  {modPermissions.map((code: PermissionCode) => {
                    const granted = selected.has(code);
                    const isDangerous = DANGEROUS_PERMISSIONS.has(code);

                    return (
                      <label
                        key={code}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                          isSystem ? "cursor-default" : "hover:bg-cream/30",
                          granted ? "" : "opacity-60"
                        )}
                        onClick={() => togglePermission(code)}
                      >
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded",
                            granted
                              ? "bg-gold-deep"
                              : "border-cream-darker bg-cream border"
                          )}
                        >
                          {granted && <Check className="text-cream size-3" />}
                        </div>
                        <span className="text-text-primary flex-1 text-xs">
                          {getPermissionLabel(code)}
                        </span>
                        {isDangerous && granted && (
                          <span
                            className="text-[10px] text-amber-600"
                            title="Action sensible"
                          >
                            ⚠
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
