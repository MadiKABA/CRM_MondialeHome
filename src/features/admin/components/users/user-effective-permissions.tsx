"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES, MODULE_ORDER, PERMISSIONS_BY_MODULE } from "@/lib/permissions";
import { getPermissionLabel } from "@/features/admin/lib/permission-labels";
import { DANGEROUS_PERMISSIONS } from "@/lib/permissions";
import type { PermissionCode } from "@/lib/permissions";

interface UserEffectivePermissionsProps {
  effectivePermissions: string[];
  isSuperAdmin: boolean;
}

export function UserEffectivePermissions({
  effectivePermissions,
  isSuperAdmin,
}: UserEffectivePermissionsProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["clients"]));

  const permSet = new Set(effectivePermissions);

  const toggleModule = (moduleCode: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleCode)) {
        next.delete(moduleCode);
      } else {
        next.add(moduleCode);
      }
      return next;
    });
  };

  return (
    <div className="border-cream-darker rounded-xl border p-6">
      <div className="mb-4">
        <h3 className="text-text-primary font-semibold">
          Ce que cette personne peut faire
        </h3>
        <p className="text-text-secondary mt-0.5 text-xs">
          Vue récapitulative de tous les droits actifs — lecture seule
        </p>
      </div>

      {isSuperAdmin ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">
            Super Administrateur — accès à toutes les fonctionnalités
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {MODULE_ORDER.map((moduleCode) => {
            const mod = MODULES[moduleCode];
            const modPermissions = PERMISSIONS_BY_MODULE[moduleCode] ?? [];
            const grantedCount = isSuperAdmin
              ? modPermissions.length
              : modPermissions.filter((p) => permSet.has(p)).length;
            const isOpen = openModules.has(moduleCode);

            return (
              <div
                key={moduleCode}
                className="border-cream-darker overflow-hidden rounded-lg border"
              >
                {/* En-tête module */}
                <button
                  type="button"
                  onClick={() => toggleModule(moduleCode)}
                  className="hover:bg-cream/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
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
                      grantedCount === modPermissions.length
                        ? "bg-emerald-50 text-emerald-700"
                        : grantedCount > 0
                          ? "bg-gold-light/50 text-gold-deep"
                          : "bg-cream text-text-secondary"
                    )}
                  >
                    {grantedCount}/{modPermissions.length} droits
                  </span>
                </button>

                {/* Permissions du module */}
                {isOpen && (
                  <div className="border-cream-darker divide-cream-darker divide-y border-t">
                    {modPermissions.map((code: PermissionCode) => {
                      const granted = isSuperAdmin || permSet.has(code);
                      const isDangerous = DANGEROUS_PERMISSIONS.has(code);

                      return (
                        <div
                          key={code}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5",
                            granted ? "bg-cream/10" : "opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full",
                              granted
                                ? "bg-emerald-100"
                                : "bg-cream border-cream-darker border"
                            )}
                          >
                            {granted ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Minus className="text-text-secondary size-3" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "flex-1 text-xs",
                              granted ? "text-text-primary" : "text-text-secondary"
                            )}
                          >
                            {getPermissionLabel(code)}
                          </span>
                          {isDangerous && granted && (
                            <span className="text-[10px] text-amber-600">⚠️</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
