"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Check, Search, X } from "lucide-react";
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
  canEdit: boolean;
  grantedCodes: string[];
}

export function PermissionsMatrix({
  roleId,
  isSystem,
  canEdit,
  grantedCodes,
}: PermissionsMatrixProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(grantedCodes));
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["clients"]));
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDirty =
    grantedCodes.some((c) => !selected.has(c)) ||
    [...selected].some((c) => !grantedCodes.includes(c));

  function toggleModule(moduleCode: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleCode)) {
        next.delete(moduleCode);
      } else {
        next.add(moduleCode);
      }
      return next;
    });
  }

  function togglePermission(code: string) {
    if (!canEdit) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function toggleModulePermissions(allCodes: PermissionCode[]) {
    if (!canEdit) return;
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

  function handleCancel() {
    setSelected(new Set(grantedCodes));
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
            {isSystem && " — profil système"}
          </p>
        </div>
        {canEdit && (
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

      {/* Recherche */}
      <div className="border-cream-darker flex items-center gap-2 border-b px-5 py-3">
        <Search className="text-text-secondary size-4 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un droit…"
          className="text-text-primary placeholder:text-text-secondary flex-1 bg-transparent text-sm outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Matrice */}
      <div className="divide-cream-darker divide-y p-4">
        {MODULE_ORDER.map((moduleCode) => {
          const mod = MODULES[moduleCode];
          const allModPermissions = PERMISSIONS_BY_MODULE[moduleCode] ?? [];
          const searchLower = search.toLowerCase();
          const modPermissions = search
            ? allModPermissions.filter(
                (code: PermissionCode) =>
                  getPermissionLabel(code).toLowerCase().includes(searchLower) ||
                  code.toLowerCase().includes(searchLower)
              )
            : allModPermissions;

          if (modPermissions.length === 0) return null;

          const grantedCount = modPermissions.filter((p) => selected.has(p)).length;
          const isOpen = openModules.has(moduleCode) || search.length > 0;
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
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => toggleModulePermissions(modPermissions)}
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
                          "flex items-center gap-3 px-4 py-2.5 transition-colors",
                          canEdit ? "hover:bg-cream/30 cursor-pointer" : "cursor-default",
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

      {/* Barre flottante si modifications en cours */}
      {canEdit && isDirty && (
        <div className="border-cream-darker sticky bottom-4 mx-4 mb-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-lg">
          <span className="text-text-secondary text-sm">
            Modifications non enregistrées
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="border-cream-darker text-text-secondary hover:bg-cream/50"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
