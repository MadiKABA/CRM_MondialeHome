"use client";

import { createContext, useContext, useMemo } from "react";

/**
 * Permissions effectives de l'utilisateur courant, calculées côté serveur
 * (getEffectivePermissions). Le raccourci super administrateur ("*") est
 * appliqué uniquement dans ce calcul — l'interface en hérite.
 * Affichage uniquement : le serveur reste la référence pour chaque action.
 */
const PermissionsContext = createContext<ReadonlySet<string>>(new Set());

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const set = useMemo(() => new Set(permissions), [permissions]);
  return (
    <PermissionsContext.Provider value={set}>{children}</PermissionsContext.Provider>
  );
}

export function useEffectivePermissions(): ReadonlySet<string> {
  return useContext(PermissionsContext);
}
