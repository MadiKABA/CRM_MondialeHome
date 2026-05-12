import { usePermission } from "@/hooks/use-permission";
import type { Permission } from "@/lib/permissions";
import type { ReactNode } from "react";

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = usePermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
